# How to deploy things

npm install
mbt build
cf deploy mta_archives/demoAppXsuaa_1.0.0.mtar


# Hybrid testing

cf create-service-key demoAppXsuaa-uaa demoAppXsuaa-uaa-key

cds bind -2 demoAppXsuaa-uaa --for hybrid


# Getting Started

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`http/` | http files to test your setup
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`README.md` | this getting started guide

