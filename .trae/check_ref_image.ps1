Add-Type -AssemblyName System.Drawing

$refImg = [System.Drawing.Image]::FromFile('d:\VibeTest\bigsound\public\images\products\product_bigsound_p1.png')
Write-Output ('Reference image (product_bigsound_p1.png): ' + $refImg.Width + 'x' + $refImg.Height + ' (ratio ' + [math]::Round($refImg.Width/$refImg.Height, 2) + ')')
$refImg.Dispose()

Write-Output ''
Write-Output 'All existing product images:'
Get-ChildItem 'd:\VibeTest\bigsound\public\images\products\*.png' | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $ratio = [math]::Round($img.Width / $img.Height, 2)
  Write-Output ('  ' + $_.Name + ' - ' + $img.Width + 'x' + $img.Height + ' (ratio ' + $ratio + ')')
  $img.Dispose()
}
