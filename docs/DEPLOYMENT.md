# Deployment

The application is designed to be deployed beside the existing `shouldiblanket` stack, without sharing its Compose project, containers, volumes, or port. The container binds to `127.0.0.1:8091` on the server; Nginx should proxy `representme.jlaramore.com` to that port after checking the existing configuration.

## GitHub Actions secrets

Configure these repository secrets:

- `DEPLOY_HOST`: server hostname or IP
- `DEPLOY_USER`: SSH deployment user
- `DEPLOY_SSH_KEY`: private key for that user
- `DEPLOY_PATH`: `/home/joey/represent-me`

The deploy user needs permission to pull the repository and run the project’s Docker Compose commands. The workflow deliberately does not change DNS, Nginx, or TLS configuration.

## First server setup

The workflow bootstraps the public repository into `DEPLOY_PATH` on its first run. Check the existing Nginx configuration for conflicts, then add an Nginx site for `representme.jlaramore.com` proxying to `127.0.0.1:8091` and provision HTTPS using the server’s existing convention. Verify `/healthz` locally and through the public hostname.
