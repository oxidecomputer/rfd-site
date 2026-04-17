# RFD Image Hosting

Images for the RFD frontend are stored external to the codebase, and the configuration
stored here defines the GCP infrastructure used to host them.

For images we want to be able to:

1. Require a user to authenticate to access an image even if they know the path to the image
2. Serve images without requiring a trip through the frontend server

Generally any CDN can satisfy point 2 alone. Combining both requirements though is more
difficult without requiring that the CDN understanding user authentication. The solution
here does not fully satisfy the above requirements, but attempts to get close. Images served
from the generated infrastructure require that the image url contain a valid signature that
encodes the image being requested, how long the url is valid for, and the key used to sign
the request. Once a url expires it will begin responding with a 403 error. This allows for
the paths to images to be publicly known without providing generic public access.

Note: Infrastructure configuration is stored in this repository until a point in time where
we have RFD infrastructure that is separate from `cio`. At that point, this infrastructure
should be owned by the RFD service.

## Storage Provider Configuration

The application supports two storage backends for serving static assets: GCS (Google Cloud
Storage) and S3 (AWS S3 or S3-compatible services).

### Common Environment Variables

| Variable           | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| `STORAGE_PROVIDER` | Storage backend to use: `gcs` (default) or `s3`                            |
| `STORAGE_URL_TTL`  | Pre-signed URL expiration time in seconds (optional, defaults to 24 hours) |

### GCS Configuration

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `STORAGE_URL`      | Base URL of the GCS CDN bucket |
| `STORAGE_KEY_NAME` | Name of the signing key        |
| `STORAGE_KEY`      | Base64-encoded signing key     |

### S3 Configuration

| Variable                | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `S3_BUCKET`             | S3 bucket name                                               |
| `AWS_REGION`            | AWS region (standard AWS SDK variable)                       |
| `AWS_ACCESS_KEY_ID`     | AWS access key (standard AWS SDK variable, or use IAM roles) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (standard AWS SDK variable, or use IAM roles) |
| `AWS_ENDPOINT_URL`      | Custom endpoint for S3-compatible services (optional)        |

The S3 integration uses the AWS SDK default credential chain, so credentials can be provided
via environment variables, IAM instance roles, ECS task roles, or other standard AWS
methods.

### GCP Infrastructure

Image storage and serving is handled by
[Cloud CDN](https://cloud.google.com/cdn/docs/using-signed-urls), backed by
[Cloud Storage](https://cloud.google.com/storage).

```
┌─────────────────┐
│    Cloud CDN    ├─ Cache
└────────┬────────┘
┌────────┴────────┐
│  Load Balancer  │
└────────┬────────┘
┌────────┴────────┐
│ Backend Bucket  ├─ Validate signature
└────────┬────────┘
┌────────┴────────┐
│  Cloud Storage  │
└─────────────────┘
```

### Deploy

There are a few steps to deploying this infrastructure:

1. Run `create_cert.sh <project>` to generate a TLS certificate to attach to the load
   balancer. We do not create a certificate during Terraform step to prevent the private key
   from being written to the tfstate.
   https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_ssl_certificate
2. Run `terraform apply`. If you changed the name of the certificate created in
   `create_cert.sh` or the project to be deployed to, then ensure that the `cert` and
   `project` variables are specified.
3. Run `add_signing_key.sh <project> <backend-bucket> <key-name>` to generate a signing key.
   This wil output the secret signing key for generating signed urls. Ensure that this key
   is stored securely, it can not be recovered. We do not generate this key during the
   Terraform step as doing so would write the key to the tfstate.
   https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_backend_service_signed_url_key
4. Run `activate.sh <project> <storage-bucket>` to grant permission for Cloud CDN to read
   from the generated storage bucket.
5. Create a DNS record pointing `static.rfd.shared.oxide.computer` (unless you used a
   different domain name) to the IP address allocated by executing the Terraform config.
