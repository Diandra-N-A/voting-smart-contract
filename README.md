# Simple Voting Smart Contract

## Deskripsi

Simple Voting adalah smart contract Solidity untuk membuat kandidat, menerima vote satu kali per alamat, menghitung hasil voting, dan menentukan pemenang setelah periode voting selesai.

Project ini menggunakan Hardhat dan dapat di-deploy ke local blockchain untuk interaksi melalui MetaMask.

## Anggota Kelompok

- Nama 1 (NRP)
- Nama 2 (NRP)

## Fitur

- Owner dapat menambahkan kandidat/proposal.
- User dapat vote satu kali per alamat.
- Hasil vote setiap kandidat dapat dilihat.
- Event saat kandidat dibuat, vote dilakukan, voting power berubah, deadline diperpanjang, dan quorum diubah.
- Deadline voting.
- Minimum quorum.
- Weighted voting yang dapat diatur owner.
- Unit test untuk deployment, positive case, negative case, access control, dan event.

## Struktur Project

```text
contracts/SimpleVoting.sol
test/SimpleVoting.test.js
scripts/deploy.js
scripts/interact.js
hardhat.config.js
package.json
README.md
.gitignore
```

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm
- MetaMask untuk demo interaksi manual

### Installation

```bash
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Coverage

```bash
npx hardhat coverage
```

### Deploy ke Local Blockchain

Terminal 1:

```bash
npx hardhat node
```

Terminal 2:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Simpan alamat contract yang muncul dari output deploy.

## Interaksi via Script

PowerShell:

```powershell
$env:CONTRACT_ADDRESS="alamat_contract_dari_deploy"
npx hardhat run scripts/interact.js --network localhost
```

## Interaksi via MetaMask

1. Buka MetaMask dan tambah network baru.
2. Isi konfigurasi:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
3. Import salah satu private key account dari output `npx hardhat node`.
4. Deploy contract dengan command deploy lokal.
5. Untuk interaksi mudah, buka Remix, pilih environment `Injected Provider - MetaMask`, lalu gunakan contract address hasil deploy.
6. Jalankan minimal dua transaksi berbeda, misalnya `setVotingPower` dan `vote`.

## Contract Address

Isi setelah deploy:

```text
SimpleVoting deployed to: <alamat_contract>
```

## Screenshot Bukti

Tambahkan screenshot berikut sebelum submit:

- Compile berhasil: `npx hardhat compile`
- Test passing: `npx hardhat test`
- Deploy berhasil: output contract address
- MetaMask connected: network Hardhat Local
- Transaksi berhasil: minimal `setVotingPower` dan `vote`
- State berubah: `getCandidate`, `totalVotes`, atau `isQuorumReached`

## Catatan Demo

Saat demo, jelaskan alur berikut:

1. Owner deploy contract dengan durasi voting dan minimum quorum.
2. Owner menambahkan kandidat.
3. Owner dapat mengatur voting power alamat tertentu.
4. User vote satu kali.
5. Contract menolak double vote dan vote setelah deadline.
6. Setelah deadline, pemenang bisa dilihat jika quorum tercapai.
