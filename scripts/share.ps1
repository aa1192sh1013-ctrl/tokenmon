$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$shareDirectory = Join-Path $projectRoot 'dist'
[System.IO.Directory]::CreateDirectory($shareDirectory) | Out-Null
$archivePath = Join-Path $shareDirectory 'tokenmon-share.zip'

# Only application files enter the archive; never enumerate user data or build caches.
$includeNames = @('app', 'components', 'lib', 'public', 'scripts', 'tests',
    'LICENSE', 'README.md', 'START-HERE.md', 'start-tokenmon.cmd',
    'package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', '.gitignore')
Add-Type -AssemblyName System.IO.Compression
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in $includeNames) {
        $source = Join-Path $projectRoot $name
        if (-not (Test-Path -LiteralPath $source)) { throw "Missing release input: $name" }
        $files = if (Test-Path -LiteralPath $source -PathType Container) {
            Get-ChildItem -LiteralPath $source -File -Recurse
        } else { Get-Item -LiteralPath $source -Force }
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
            $entry = $archive.CreateEntry("tokenmon/$relative", [System.IO.Compression.CompressionLevel]::Optimal)
            $inputStream = $file.OpenRead()
            $outputStream = $entry.Open()
            try { $inputStream.CopyTo($outputStream) }
            finally { $outputStream.Dispose(); $inputStream.Dispose() }
        }
    }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Output "Created: $archivePath"
Write-Output "Size: $([Math]::Round((Get-Item -LiteralPath $archivePath).Length / 1MB, 1)) MB"
