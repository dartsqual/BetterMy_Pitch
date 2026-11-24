#!/usr/bin/env bash
# Provision the BetterMy Pitch VM on Magalu Cloud (br-se1): dedicated security
# group (22 from your IP, 80/443 public) + Ubuntu 24.04 VM with a public IP.
# Requires: mgc auth login. Env: MACHINE_TYPE (default BV2-8-40), SSH_KEY_NAME.
set -euo pipefail
MGC=${MGC:-mgc}
REGION=${REGION:-br-se1}
NAME=${NAME:-bmp-01}
MACHINE_TYPE=${MACHINE_TYPE:-BV2-8-40}
SSH_KEY_NAME=${SSH_KEY_NAME:?set SSH_KEY_NAME to a key registered in Magalu}
MYIP=${MYIP:-$(curl -4 -fsS --noproxy '*' https://api.ipify.org)}
DIR=$(cd "$(dirname "$0")" && pwd)
m(){ "$MGC" "$@" --region "$REGION" -o json -r --no-confirm </dev/null 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | sed -n '/^[[{]/,$p'; }
jq_(){ python3 -c "import sys,json; d=json.load(sys.stdin); print($1)"; }

SG=$(m network security-groups list | jq_ "next((g['id'] for g in d['security_groups'] if g['name']=='bmp-sg'), '')")
if [ -z "$SG" ]; then
  SG=$(m network security-groups create --name bmp-sg --description "BetterMy Pitch: ssh from admin, http/https public" --wait | jq_ "d['id']")
  rule(){ m network security-groups rules create --security-group-id "$SG" --direction ingress --ethertype IPv4 \
    --protocol "$1" --port-range-min "$2" --port-range-max "$2" --remote-ip-prefix "$3" --description "$4" --wait >/dev/null; }
  rule tcp 22 "$MYIP/32" "ssh admin"
  rule tcp 80 0.0.0.0/0 "http"
  rule tcp 443 0.0.0.0/0 "https"
  rule udp 443 0.0.0.0/0 "http3"
fi
echo "security_group=$SG"

ID=$(m vm instances create --name "$NAME" --machine-type.name "$MACHINE_TYPE" --image.name "cloud-ubuntu-24.04 LTS" \
  --ssh-key-name "$SSH_KEY_NAME" --network.associate-public-ip=true \
  --network.interface.security-groups "[{\"id\":\"$SG\"}]" \
  --user-data "$(base64 < "$DIR/cloud-init.yaml" | tr -d '\n')" --labels "bettermypitch" | jq_ "d['id']")
echo "instance=$ID"
for i in $(seq 1 60); do
  OUT=$(m vm instances get "$ID" --expand network)
  STATE=$(echo "$OUT" | jq_ "d.get('state')")
  IP=$(echo "$OUT" | jq_ "next((n.get('associated_public_ipv4') for n in d.get('network',{}).get('interfaces',[]) if n.get('associated_public_ipv4')), '')")
  [ "$STATE" = running ] && [ -n "$IP" ] && break
  sleep 10
done
echo "state=$STATE"
echo "public_ip=$IP"
