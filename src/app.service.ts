import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { EmailService } from './email/email.service';
import { BRL, waitForMs } from './helpers';
import {
  blocklistPath,
  neighborhoodMapCoordinates,
  realEstateApiBaseUrl,
  realEstateClientBaseUrl,
} from './constants';

@Injectable()
export class AppService {
  constructor(private emailService: EmailService) {
    this.setContinuousPolling();
  }

  private async setContinuousPolling() {
    try {
      await this.pollFromClient();
      const intervalInSeconds = 60 * Math.random() + 60;
      await waitForMs(1000 * intervalInSeconds);
    } catch (e) {
      console.error(e);
    }

    this.setContinuousPolling();
  }

  private async pollFromClient() {
    console.log('Started polling...');
    const newOpportunities = await this.checkNewOpportunities();

    const notificationEmailTitle = `${
      newOpportunities.length
    } novas oportunidades encontradas - ${Date.now()}`;

    const notificationEmailBody = newOpportunities.reduce(
      (currentDescription, opportunity) =>
        `${currentDescription}${opportunity.description}\n\n`,
      '',
    );

    if (newOpportunities.length > 0) {
      console.log('Sending email...');
      await this.emailService.sendEmail({
        title: notificationEmailTitle,
        body: notificationEmailBody,
      });
    } else {
      console.log('No opportunities found.');
    }

    console.log('Done!');
  }

  private extractResults(apiResponse: any) {
    const hits = apiResponse.hits.hits;
    return hits.map((hit) => {
      const source = hit._source;
      source.url = `${realEstateClientBaseUrl}/imovel/${source.id}/alugar/`;
      source.description = `
        ${source.type.toUpperCase()} de ${source.area}m²
        ${source.bedrooms} quartos
        ${source.bathrooms} banheiros
        ${source.parkingSpaces} vagas
        ${source.isFurnished ? 'Mobiliado' : ''}
        ${
          source.visitStatus === 'ACCEPT_NEW'
            ? 'DISPONÍVEL para visitas'
            : source.visitStatus
        } na ${source.address}, ${source.regionName} - ${source.city}.
        Preço total: ${BRL.format(source.totalCost)}
        Aluguel: ${BRL.format(source.rent)}
        IPTU + condomínio: ${BRL.format(source.iptuPlusCondominium)}
        Link: ${source.url}
      `;
      delete source.visitStatus;
      delete source.city;
      return source;
    });
  }

  async checkNewOpportunities() {
    const neighborhoodsOfInterest = [
      'São Pedro',
      'Savassi',
      'Funcionários',
      'Sion',
      'Carmo',
      'Santo Antônio',
    ];

    console.log(`Fetching blocklist...`);
    const blocklist = await this.getBlockList();

    const results = [];

    for (const neighborhood of neighborhoodsOfInterest) {
      console.log(`Polling for ${neighborhood}...`);
      const response = await this.fetchRealEstateOpportunities(
        neighborhood,
        blocklist,
      );

      const neighborhoodResults = this.extractResults(response);

      neighborhoodResults.forEach((result) => {
        console.log(`Found ${result.id}`);
        results.push(result);
        blocklist.push(result.id);
      });

      const interval = 5000 * Math.random();
      await waitForMs(interval);
    }

    console.log(`Saving blocklist...`);
    await this.saveBlockList(blocklist);

    return results;
  }

  async saveBlockList(ids: string[]) {
    await fs.writeFile(blocklistPath, JSON.stringify(ids, undefined, 2), {
      encoding: 'utf-8',
    });
  }

  async getBlockList(): Promise<string[]> {
    try {
      const results = await fs.readFile(blocklistPath, { encoding: 'utf-8' });
      return JSON.parse(results);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async fetchRealEstateOpportunities(
    neighborhood: string,
    blocklist: string[],
  ) {
    const route = `${realEstateApiBaseUrl}/yellow-pages/v2/search?photos=12&relax_query=false`;

    const response = await fetch(route, {
      method: 'POST',
      body: JSON.stringify({
        filters: {
          availability: 'any',
          occupancy: 'any',
          blocklist,
          country_code: 'BR',
          keyword_match: [
            `neighborhood:${neighborhood}`,
            `city:Belo Horizonte`,
          ],
          map: neighborhoodMapCoordinates[neighborhood],
          sorting: {
            criteria: 'relevance_rent',
            order: 'desc',
          },
          page_size: 11,
          offset: 0,
        },
        return: [
          'id',
          'rent',
          'totalCost',
          'iptuPlusCondominium',
          'area',
          'address',
          'regionName',
          'city',
          'visitStatus',
          'activeSpecialConditions',
          'type',
          'forRent',
          'bedrooms',
          'parkingSpaces',
          'listingTags',
          'yield',
          'yieldStrategy',
          'neighbourhood',
          'categories',
          'bathrooms',
          'isFurnished',
          'installations',
        ],
        business_context: 'RENT',
        relax_query: false,
        force_raw_search: false,
        search_query_context: 'neighborhood',
      }),
    });
    return response.json();
  }
}
