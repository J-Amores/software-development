# Infrastructure

Terraform that stands the app up in an Employer's own AWS account (ADR 0001,
ADR 0003), parameterized with the Employer's name, currency, initial Program
Rules, Reporting Lines CSV and first Administrator.

Empty until ticket 17. Deploying is optional and manual: no build, test, CI run,
local setup or demo may depend on live AWS, so nothing here is on any other
path. Per ADR 0008 this is the one place that is not written test-first —
validation and plan checks are written alongside it.
