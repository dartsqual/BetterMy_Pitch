#!/usr/bin/env bash
# Provision the BetterMy Pitch VM on OCI (sa-saopaulo-1): reuses the "apps"
# compartment and app-vcn/app-public subnet, adds an NSG for 22/80/443 and
# launches VM.Standard.A1.Flex (default 4 OCPU / 24 GB), retrying on
# "Out of host capacity". Requires: oci session authenticate --profile-name DEFAULT
set -euo pipefail
OCI="oci --auth security_token --profile DEFAULT"
TENANCY=${TENANCY:-ocid1.tenancy.oc1..aaaaaaaa5goqwlxbleglovuge2qe5bez73ghz7gznkiksbid73kvq3yomcta}
OCPUS=${OCPUS:-4}; MEM=${MEM:-24}; NAME=${NAME:-oci-bmp-01}
MYIP=${MYIP:-$(curl -4 -fsS --noproxy '*' https://api.ipify.org)}
SSH_PUB=${SSH_PUB:-$HOME/.ssh/id_ed25519.pub}
DIR=$(cd "$(dirname "$0")" && pwd)
q(){ $OCI "$@" --raw-output; }

CID=$(q iam compartment list --compartment-id "$TENANCY" --name apps --lifecycle-state ACTIVE --query 'data[0].id')
VCN=$(q network vcn list -c "$CID" --display-name app-vcn --query 'data[0].id')
SUB=$(q network subnet list -c "$CID" --vcn-id "$VCN" --display-name app-public --query 'data[0].id')
echo "compartment=$CID subnet=$SUB my_ip=$MYIP"

NSG=$(q network nsg list -c "$CID" --vcn-id "$VCN" --display-name bmp-nsg --query 'data[0].id' 2>/dev/null || true)
if [ -z "$NSG" ] || [ "$NSG" = "null" ]; then
  NSG=$(q network nsg create -c "$CID" --vcn-id "$VCN" --display-name bmp-nsg --wait-for-state AVAILABLE --query 'data.id')
  rule(){ echo "{\"direction\":\"INGRESS\",\"protocol\":\"$1\",\"source\":\"$2\",\"sourceType\":\"CIDR_BLOCK\",\"$3\":{\"destinationPortRange\":{\"min\":$4,\"max\":$4}}}"; }
  $OCI network nsg rules add --nsg-id "$NSG" --security-rules "[
    $(rule 6 "$MYIP/32" tcpOptions 22),
    $(rule 6 0.0.0.0/0 tcpOptions 80),
    $(rule 6 0.0.0.0/0 tcpOptions 443),
    $(rule 17 0.0.0.0/0 udpOptions 443)]" >/dev/null
fi
echo "nsg=$NSG"

AD=$(q iam availability-domain list --compartment-id "$TENANCY" --query 'data[0].name')
IMG=$(q compute image list -c "$TENANCY" --operating-system "Canonical Ubuntu" --operating-system-version "24.04" \
  --shape VM.Standard.A1.Flex --sort-by TIMECREATED --query 'data[0].id')

for i in $(seq 1 ${TRIES:-40}); do
  OUT=$(q compute instance launch -c "$CID" --availability-domain "$AD" --shape VM.Standard.A1.Flex \
    --shape-config "{\"ocpus\":$OCPUS,\"memoryInGBs\":$MEM}" --image-id "$IMG" \
    --subnet-id "$SUB" --nsg-ids "[\"$NSG\"]" --assign-public-ip true \
    --display-name "$NAME" --hostname-label bmp \
    --ssh-authorized-keys-file "$SSH_PUB" --user-data-file "$DIR/cloud-init.yaml" \
    --boot-volume-size-in-gbs 100 --wait-for-state RUNNING --query 'data.id' 2>&1) && break
  echo "$(date +%T) attempt $i: $(echo "$OUT" | grep -oE '"message": "[^"]+"' | head -1)" >&2
  OUT=""; sleep 60
done
[[ "$OUT" == ocid1.instance* ]] || { echo "could not launch the VM" >&2; exit 1; }
IP=$(q compute instance list-vnics --instance-id "$OUT" --query 'data[0]."public-ip"')
echo "instance=$OUT"
echo "public_ip=$IP"
