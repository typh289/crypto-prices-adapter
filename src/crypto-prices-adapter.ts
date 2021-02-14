/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';

import fetch from 'node-fetch';

export class Pair extends Device {
  private pair: string;
  private priceChange: Property;
  private priceChangePercent: Property;
  private lastPrice: Property;
  private highPrice: Property;
  private lowPrice: Property;
  private volume: Property;



  constructor(adapter: Adapter, pair: string) {
    super(adapter, pair);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this.name = `Market price ${pair}`;
    this.description = 'Market price ${pair}';
    this.pair = pair;

    this.lastPrice = this.createProperty('lastPrice', {
      type: 'number',
      title: 'Last price',
      description: 'Last trade price (updated 15m) ',
      readOnly: true,
    });
    this.priceChange = this.createProperty('priceChange', {
      type: 'number',
      title: 'Price change',
      description: 'Price change 24h ',
      readOnly: true,
    });
    this.priceChangePercent = this.createProperty('priceChangePercent', {
      type: 'number',
      title: 'Price change %',
      description: 'Price change % 24h ',
      readOnly: true,
      unit: 'percent',
    });
    this.highPrice = this.createProperty('highPrice', {
      type: 'number',
      title: 'high price',
      description: 'Last 24 high price',
      readOnly: true,
    });
    this.lowPrice = this.createProperty('lowPrice', {
      type: 'number',
      title: 'low price',
      description: 'Last 24 low price',
      readOnly: true,
    });
    this.volume = this.createProperty('volume', {
      type: 'number',
      title: '24h Volume',
      description: '24h Volume',
      readOnly: true,
    });
  }

  createProperty(name: string, description: any) {
    const property = new Property(this, name, description);
    this.properties.set(name, property);
    return property;
  }

  startPolling(interval: number) {
    this.poll();

    setInterval(() => {
      this.poll();
    }, interval * 1000);
  }

  async poll() {
    const result = await fetch(`https://www.binance.com/api/v3/ticker/24hr?symbol=${this.pair}`);
    const json = await result.json();

    this.lastPrice.setCachedValueAndNotify(json.lastPrice);
    this.priceChange.setCachedValueAndNotify(json.priceChange);
    this.priceChangePercent.setCachedValueAndNotify(json.priceChangePercent);
    this.highPrice.setCachedValueAndNotify(json.highPrice);
    this.lowPrice.setCachedValueAndNotify(json.lowPrice);
    this.volume.setCachedValueAndNotify(json.volume);
    
  }
}

export class CryptoPricesAdapter extends Adapter {
  constructor(addonManager: any, manifest: any) {
    super(addonManager, CryptoPricesAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    if (!manifest.moziot.config.pair) {
      return;
    }

    for (const name of manifest.moziot.config.pair) {
      console.log(`Tracking crypto prices of ${name}`);
      const pair = new Pair(this, name);
      this.handleDeviceAdded(pair);
      pair.startPolling(15 * 60);
    }
  }
}
