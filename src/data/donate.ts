/**
 * Public donation methods shown on About. Shared with the crawlable /about/donate page.
 */

export const VENMO = {
  handle: '@davidtphung',
  url: 'https://venmo.com/davidtphung',
} as const

export const CRYPTO_METHODS = [
  {
    key: 'btc',
    name: 'Bitcoin',
    network: 'Bitcoin Network',
    address: '3LmGHi5gvPbFYrstbBS5MTbLcQuWEBVBQq',
  },
  {
    key: 'cbbtc',
    name: 'cbBTC',
    network: 'Base Network',
    address: '0xF24594C7023A2a0b6dFb97F07ae1c1eb970a9816',
  },
  {
    key: 'usdc',
    name: 'USDC',
    network: 'Base Network',
    address: '0xb25eb698392eaE827b64EEB9cb124C62Be0D3dD7',
  },
  {
    key: 'eth',
    name: 'Ethereum',
    network: 'Ethereum Network',
    address: '0x1A1c37C145a1EaB58C43F003EBB55C18083b5987',
  },
] as const
