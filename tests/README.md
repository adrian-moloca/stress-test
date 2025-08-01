npx playwright install --with-deps chromium
npx playwright test





TODO:

sarebbe bello trovare qualcosa tipo

  if (process.env.DEBUG_TESTS) {
    page.on('console', msg => console.log('AUTH - CONSOLE LOG', msg.text()))
    page.on('pageerror', err => {
      console.log('AUTH - PAGE ERROR', err.message)
    })
  }

  ma metterlo per tutte le pagine automaticamente e non scritto per ciascuna.