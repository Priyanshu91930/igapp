Add-Type -AssemblyName System.Drawing

$srcPath = "d:\downloader-api\igapp\icon2.png"
if (!(Test-Path $srcPath)) {
    Write-Error "Source icon2.png not found"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImage = [System.Drawing.Image]::FromStream($ms)

function Make-WhiteSilhouette {
    param(
        [System.Drawing.Image]$image,
        [int]$width,
        [int]$height,
        [string]$outputPath
    )
    # Create resized bitmap
    $resized = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Draw with padding (70% scale centered)
    $targetW = [int]($width * 0.70)
    $targetH = [int]($height * 0.70)
    $offsetX = [int](($width - $targetW) / 2)
    $offsetY = [int](($height - $targetH) / 2)
    $drawRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $targetW, $targetH)
    $g.DrawImage($image, $drawRect)
    $g.Dispose()

    # Convert non-transparent pixels to pure white (#FFFFFF)
    for ($x = 0; $x -lt $resized.Width; $x++) {
        for ($y = 0; $y -lt $resized.Height; $y++) {
            $pixel = $resized.GetPixel($x, $y)
            if ($pixel.A -gt 40) {
                # Keep alpha, set RGB to 255, 255, 255
                $whitePixel = [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255)
                $resized.SetPixel($x, $y, $whitePixel)
            } else {
                $resized.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            }
        }
    }

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $resized.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Host "Generated White Notification Icon: $outputPath ($width x $height)"
}

# Generate JS assets notification icon (96x96)
Make-WhiteSilhouette -image $srcImage -width 96 -height 96 -outputPath "d:\downloader-api\igapp\assets\notification-icon.png"

# Generate Android drawable notification icons
$drawables = @(
    @{ name = "drawable-mdpi"; notifSize = 24 },
    @{ name = "drawable-hdpi"; notifSize = 36 },
    @{ name = "drawable-xhdpi"; notifSize = 48 },
    @{ name = "drawable-xxhdpi"; notifSize = 72 },
    @{ name = "drawable-xxxhdpi"; notifSize = 96 }
)

foreach ($d in $drawables) {
    $dir = "d:\downloader-api\igapp\android\app\src\main\res\" + $d.name
    Make-WhiteSilhouette -image $srcImage -width $d.notifSize -height $d.notifSize -outputPath "$dir\notification_icon.png"
}

$srcImage.Dispose()
$ms.Dispose()
Write-Host "All white silhouette notification icons generated successfully!"
