# Terraform job image: config and the spatial manifest are baked in, so the job needs no bind
# mounts from the project directory (macOS Docker Desktop file-sharing permissions not required).
FROM hashicorp/terraform:1.9.8
WORKDIR /tf
COPY main.tf ./
COPY --from=manifest zone_manifest.json /manifest/zone_manifest.json
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["mkdir -p /state/plugin-cache && terraform init -input=false && terraform apply -auto-approve -input=false"]
