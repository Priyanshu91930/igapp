Add-Type -AssemblyName System.Drawing

$srcPath = "d:\downloader-api\igapp\icon2.png"
if (!(Test-Path $srcPath)) {
    Write-Error "Source icon2.png not found"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImage = [System.Drawing.Image]::FromStream($ms)

function Resize-Image {
    param(
        [System.Drawing.Image]$image,
        [int]$width,
        [int]$height,
        [string]$outputPath,
        [bool]$padded = $false,
        [float]$padRatio = 0.66
    )
    $destImage = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $graphics.Clear([System.Drawing.Color]::Transparent)

    if ($padded) {
        $targetW = [int]($width * $padRatio)
        $targetH = [int]($height * $padRatio)
        $offsetX = [int](($width - $targetW) / 2)
        $offsetY = [int](($height - $targetH) / 2)
        $drawRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $targetW, $targetH)
        $graphics.DrawImage($image, $drawRect)
    } else {
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
        $graphics.DrawImage($image, $destRect)
    }

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $destImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destImage.Dispose()
    Write-Host "Generated $outputPath ($width x $height)"
}

# 1. Base files
Copy-Item $srcPath "d:\downloader-api\igapp\icon.png" -Force
Copy-Item $srcPath "d:\downloader-api\igapp\assets\icon.png" -Force
Copy-Item $srcPath "d:\downloader-api\igapp\assets\splash-icon.png" -Force
Copy-Item $srcPath "d:\downloader-api\igapp\assets\notification-icon.png" -Force

Resize-Image -image $srcImage -width 1024 -height 1024 -outputPath "d:\downloader-api\igapp\assets\android-icon-foreground.png" -padded $true -padRatio 0.70
Resize-Image -image $srcImage -width 48 -height 48 -outputPath "d:\downloader-api\igapp\assets\favicon.png"

# 2. Mipmap launcher icons
$mipmaps = @(
    @{ name = "mipmap-mdpi"; size = 48; fgSize = 108 },
    @{ name = "mipmap-hdpi"; size = 72; fgSize = 162 },
    @{ name = "mipmap-xhdpi"; size = 96; fgSize = 216 },
    @{ name = "mipmap-xxhdpi"; size = 144; fgSize = 324 },
    @{ name = "mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

foreach ($m in $mipmaps) {
    $dir = "d:\downloader-api\igapp\android\app\src\main\res\" + $m.name
    Resize-Image -image $srcImage -width $m.size -height $m.size -outputPath "$dir\ic_launcher.png"
    Resize-Image -image $srcImage -width $m.size -height $m.size -outputPath "$dir\ic_launcher_round.png"
    Resize-Image -image $srcImage -width $m.fgSize -height $m.fgSize -outputPath "$dir\ic_launcher_foreground.png" -padded $true -padRatio 0.66
}

# 3. Drawables splashscreen & notifications
$drawables = @(
    @{ name = "drawable-mdpi"; splashSize = 200; notifSize = 48 },
    @{ name = "drawable-hdpi"; splashSize = 300; notifSize = 72 },
    @{ name = "drawable-xhdpi"; splashSize = 400; notifSize = 96 },
    @{ name = "drawable-xxhdpi"; splashSize = 600; notifSize = 144 },
    @{ name = "drawable-xxxhdpi"; splashSize = 800; notifSize = 192 }
)

foreach ($d in $drawables) {
    $dir = "d:\downloader-api\igapp\android\app\src\main\res\" + $d.name
    Resize-Image -image $srcImage -width $d.splashSize -height $d.splashSize -outputPath "$dir\splashscreen_logo.png"
    Resize-Image -image $srcImage -width $d.notifSize -height $d.notifSize -outputPath "$dir\notification_icon.png"
}

$srcImage.Dispose()
$ms.Dispose()
Write-Host "All icons generated successfully from icon2.png!"
