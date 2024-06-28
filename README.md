# F1 Worker  

For testing out API implementation and DB design with Formula data in a serverless environment provided by Cloudflare Workers.  
  
### Configure  
  
To configure, update `wrangler.toml` to use your database information.  
  
### Database load  
  
To load the D1 database, run this command for each of the SQL files in /db  
wrangler d1 execute \<db-plain-name\> --remote --file=\<file-name\>  
  
### Node Install & Run  
  
To run this site, install wrangler from Cloudflare.  
`nmp install wrangler`  
Then run `wrangler dev --remote` or `wrangler deploy` to test and deploy your site, respectively.
