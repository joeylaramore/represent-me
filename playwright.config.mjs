import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'tests/browser',
  timeout:15000,
  workers:1,
  reporter:'line',
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  webServer:{command:'python -m http.server 4173',url:'http://127.0.0.1:4173',reuseExistingServer:true,timeout:10000},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:900}}},
    {name:'mobile',use:{...devices['Pixel 7']}}
  ]
});
