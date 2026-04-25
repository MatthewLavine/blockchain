#!/bin/bash

# Number of nodes to start (default to 5)
NODES=${1:-5}
BASE_PORT=3000
BASE_P2P=6000

echo "🚀 Launching Antigravity Chain Network with $NODES nodes..."

# Create a logs directory if it doesn't exist
mkdir -p logs

for (( i=0; i<$NODES; i++ ))
do
    HTTP_PORT=$((BASE_PORT + i))
    P2P_PORT=$((BASE_P2P + i))
    
    # We set Node 0 as the seed for all other nodes
    SEED_VAR=""
    if [ $i -gt 0 ]; then
        SEED_VAR="SEED_NODE=ws://localhost:$BASE_P2P"
    fi

    echo "  -> Starting Node $i (HTTP: $HTTP_PORT, P2P: $P2P_PORT)..."
    
    # Start the node in the background and redirect logs to a file
    env $SEED_VAR PORT=$HTTP_PORT P2P_PORT=$P2P_PORT npm run dev > "logs/node_$i.log" 2>&1 &
    
    # Store the PID so we can kill them later if needed
    echo $! >> "logs/network.pid"
    
    if [ $i -eq 0 ]; then
        # Give the anchor node a moment to start
        sleep 3
    fi
done

echo -e "\n✅ Network is live! (Logs available in the /logs directory)"
echo "Dashboards available at:"
for (( i=0; i<$NODES; i++ ))
do
    HTTP_PORT=$((BASE_PORT + i))
    echo " - http://localhost:$HTTP_PORT"
done

echo -e "\n💡 To stop the network, run: kill \$(cat logs/network.pid) && rm logs/network.pid"
