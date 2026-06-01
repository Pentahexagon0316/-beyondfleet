if (
  process.env.NODE_ENV === 'production'
  && process.env.ALLOW_PRODUCTION_SEED !== 'true'
) {
  throw new Error('Production seed blocked. Set ALLOW_PRODUCTION_SEED=true to continue.')
}

console.log('Seed protection passed.')
