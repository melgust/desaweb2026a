$ErrorActionPreference = 'Stop'
$orderProjectRoot = Split-Path $PSScriptRoot -Parent
$orderLocalPath = Join-Path $orderProjectRoot '.local'
New-Item -ItemType Directory -Force -Path $orderLocalPath | Out-Null
$orderCertificates = Get-ChildItem Cert:\LocalMachine\Root,Cert:\CurrentUser\Root,Cert:\LocalMachine\CA,Cert:\CurrentUser\CA
$orderPem = ($orderCertificates | ForEach-Object {
    '-----BEGIN CERTIFICATE-----' + [Environment]::NewLine +
    [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks) +
    [Environment]::NewLine + '-----END CERTIFICATE-----'
}) -join [Environment]::NewLine
[IO.File]::WriteAllText((Join-Path $orderLocalPath 'trusted-ca.pem'), $orderPem)
$orderTrustStore = Join-Path $orderLocalPath 'java-cacerts'
if (-not (Test-Path -LiteralPath $orderTrustStore)) {
    & keytool -importkeystore -srckeystore NONE -srcstoretype Windows-ROOT -destkeystore $orderTrustStore -deststoretype PKCS12 -deststorepass changeit -noprompt
    if ($LASTEXITCODE -ne 0) { throw 'Could not export Java trust store.' }
}
$orderOverride = Join-Path $orderProjectRoot 'docker-compose.override.yml'
if (-not (Test-Path -LiteralPath $orderOverride)) {
    Copy-Item -LiteralPath (Join-Path $orderProjectRoot 'docker-compose.ca.yml') -Destination $orderOverride
}
Write-Output 'Build trust configured using public Windows certificates. TLS verification remains enabled.'
