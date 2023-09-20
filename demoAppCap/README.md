# How to deploy things

npm install
mbt build
cf deploy mta_archives/demoApp_1.0.0.mtar


# Hybrid testing

cf create-service-key demoApp-uaa demoApp-uaa-key
cf create-service-key demoApp-ias demoApp-ias-key -c '{"credential-type":"X509_GENERATED"}' 

cds bind -2 demoApp-uaa --for hybrid
cds bind identity -2 demoApp-ias --kind identity --for hybrid


# Getting Started

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`http/` | http files to test your setup
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`README.md` | this getting started guide
