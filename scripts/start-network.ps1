param (
    [int]$Nodes = 5
)

$BasePort = 7000
$BaseP2P = 6000

Write-Host "🚀 Launching Antigravity Chain Network with $Nodes nodes..." -ForegroundColor Cyan

for ($i = 0; $i -lt $Nodes; $i++) {
    $HttpPort = $BasePort + $i
    $P2pPort = $BaseP2P + $i
    
    $Title = "Blockchain Node $i (HTTP: $HttpPort, P2P: $P2pPort)"
    Write-Host "  -> Starting $Title" -ForegroundColor Green
    
    # Set Node 0 as the seed for all other nodes
    $SeedVar = ""
    if ($i -gt 0) {
        $SeedVar = "`$env:SEED_NODE='ws://localhost:$BaseP2P';"
    }

    # Construct the command to run in the new window
    $Command = "$SeedVar `$env:PORT=$HttpPort; `$env:P2P_PORT=$P2pPort; `$Host.UI.RawUI.WindowTitle = '$Title'; npm run dev"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $Command
    
    # Give the first node a moment to start
    if ($i -eq 0) {
        Start-Sleep -Seconds 2
    }
}

Write-Host "`n✅ Network is live!" -ForegroundColor Cyan
Write-Host "Dashboards available at:" -ForegroundColor White
for ($i = 0; $i -lt $Nodes; $i++) {
    $p = $BasePort + $i
    Write-Host " - http://localhost:$p" -ForegroundColor Gray
}
