# Deployment

The application is designed to be deployed beside the existing `shouldiblanket` stack, without sharing its Compose project, containers, volumes, or port. The container binds to `127.0.0.1:8091` on the server; Nginx should proxy `representme.jlaramore.com` to that port after checking the existing configuration.

## GitHub Actions secrets

Configure these repository secrets:

- `DEPLOY_HOST`: server hostname or IP
- `DEPLOY_USER`: SSH deployment user
- `DEPLOY_SSH_KEY`: private key for that user
- `DEPLOY_PATH`: absolute checkout path, for example `/opt/represent-me`

The deploy user needs permission to pull the repository and run the project’s Docker Compose commands. The workflow deliberately does not change DNS, Nginx, or TLS configuration.

## First server setup

Clone the repository to `DEPLOY_PATH`, check the existing Nginx configuration for conflicts, and run `docker compose up -d --build`. Add an Nginx site for `representme.jlaramore.com` proxying to `127.0.0.1:8091`, then provision HTTPS using the server’s existing convention. Verify `/healthz` locally and through the public hostname.
