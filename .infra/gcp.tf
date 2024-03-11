provider "google" {
  project = var.project
  region  = "us-central1"
  zone    = "us-central1-c"
}

variable "project" {
  default = "websites-326710"
}

variable "prefix" {
  default = "rfd-static-assets"
}

variable "cert" {
  default = "rfd-static-cert"
}
