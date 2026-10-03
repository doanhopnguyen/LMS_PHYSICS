$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$testRoot = Join-Path $repoRoot '.tmp-comprehensive-test/backend'
Set-Location $testRoot
$report = Get-ChildItem 'target/surefire-reports' -Filter 'TEST-*.xml' | Select-Object -First 1
if (!$report) { throw 'Run mvn test in the isolated backend first to create the runtime classpath.' }
[xml]$reportXml = Get-Content $report.FullName -Raw
$testClasspath = ($reportXml.testsuite.properties.property | Where-Object name -EQ 'java.class.path').value
if (!$testClasspath) { throw 'No runtime classpath found in test report.' }
$env:SPRING_PROFILES_ACTIVE = 'test'
$env:MINIO_ENABLED = 'false'
& java '-Dspring.devtools.restart.enabled=false' -cp $testClasspath com.vatly1.example.app.JwtAuthServiceApp --spring.profiles.active=test --server.port=18080 --minio.enabled=false --spring.jpa.show-sql=false
