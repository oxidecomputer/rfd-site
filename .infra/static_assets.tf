# This configuration will spin up the core components for hosting the static assets needed by the
# RFD frontend. It does not:
#    1. Create the url signing key for the bucket backend
#    2. Grant access for Cloud CDN to access objects in the storage bucket
# These steps should be performed out of band to ensure that the signing key is not stored in the
# terraform state, and that the Cloud CDN does not have access until a signing key is set 

# These resources must be created prior to deployment and their state must not be stored as they
# hold private data
data "google_compute_ssl_certificate" "rfd_static_cert" {
  name = var.cert
}

# A random suffix to avoid colliding bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# The storage bucket for holding static assets used by the frontend
resource "google_storage_bucket" "storage_bucket" {
  name                        = "${var.prefix}-${random_id.bucket_suffix.hex}"
  location                    = "us-east1"
  uniform_bucket_level_access = true
  storage_class               = "STANDARD"
  force_destroy               = true
}

# A fixed ip address that is assigned to the load CDN loadbalancer
resource "google_compute_global_address" "ip_address" {
  name = "${var.prefix}-ip"
}

# Backend service for serving static assets from the bucket to the load balancer
resource "google_compute_backend_bucket" "backend" {
  name        = "${var.prefix}-backend"
  description = "Serves static assets for the RFD frontend"
  bucket_name = google_storage_bucket.storage_bucket.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 30
    default_ttl       = 30
    max_ttl           = 60
    negative_caching  = false
    serve_while_stale = 0
  }
}

# Frontend load balancer
resource "google_compute_url_map" "url_map" {
  name            = "${var.prefix}-http-lb"
  default_service = google_compute_backend_bucket.backend.id
}

# Route to the load balancer
resource "google_compute_target_https_proxy" "proxy" {
  name             = "${var.prefix}-https-lb-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [data.google_compute_ssl_certificate.rfd_static_cert.id]
}

# Rule to forward all traffic on the external ip address to the RFD static asset backend
resource "google_compute_global_forwarding_rule" "forwarding" {
  name                  = "${var.prefix}-https-lb-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.proxy.id
  ip_address            = google_compute_global_address.ip_address.id
}
