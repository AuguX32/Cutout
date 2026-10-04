# CUTOUT 7: download and verify the original Windows installer.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Base = 'https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0'
$Name = 'CUTOUT-7.0.0-Windows-x64-Setup.exe'
$Expected = 'aa96bd013b5ec6d46874db64563e80ffc7bcabe841c45fcdec3996a1c5469ba7'
$Output = Join-Path (Get-Location).Path $Name
if (Test-Path -LiteralPath $Output) { throw "Le fichier existe déjà : $Output" }
$Work = Join-Path ([IO.Path]::GetTempPath()) ('cutout-download-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Work | Out-Null
try {
  foreach ($Part in @('part01','part02')) {
    Invoke-WebRequest -UseBasicParsing -Uri "$Base/$Name.$Part" -OutFile (Join-Path $Work "$Name.$Part")
  }
  $Combined = Join-Path $Work $Name
  $Destination = [IO.File]::Create($Combined)
  try {
    foreach ($Part in @('part01','part02')) {
      $Source = [IO.File]::OpenRead((Join-Path $Work "$Name.$Part"))
      try { $Source.CopyTo($Destination) } finally { $Source.Dispose() }
    }
  } finally { $Destination.Dispose() }
  $Actual = (Get-FileHash -LiteralPath $Combined -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($Actual -ne $Expected) { throw 'Échec du contrôle SHA-256. Aucun installateur n’a été conservé.' }
  Move-Item -LiteralPath $Combined -Destination $Output
  Write-Host "Téléchargement vérifié : $Output"
  Write-Host "Ouvrez l’EXE pour démarrer l’assistant d’installation."
} finally { Remove-Item -LiteralPath $Work -Recurse -Force }
