export const getProofForAddress = async (
  cid: string,
  address: string,
) => {
  try {
    // Construct the URL to fetch the proof file from w3s.link gateway
    const gatewayUrl = `https://${cid}.ipfs.w3s.link/${address}.json`

    // Fetch the proof using standard fetch API
    const response = await fetch(gatewayUrl)
    if (!response.ok) {
      throw new Error(`Proof not found for address ${address}`)
    }

    // Parse the proof data
    const proofData = await response.json()
    
    console.log(`Proof for address ${address}:`, proofData)
    return proofData

  } catch (error) {
    console.error(`Error fetching proof for address ${address}:`, error)
    return null
  }
}
