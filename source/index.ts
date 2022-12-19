import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';
import fetch from 'node-fetch';

void main();

async function main() {
	try {
		await run();
	} catch (error: unknown) {
		core.setFailed(error instanceof Error ? error.message : String(error));
	}
}

async function run() {
	const version = core.getInput('version');
	const triple = core.getInput('triple');

	const downloadUrl = await getDownloadUrl(version, triple);

	const packagePath = await toolCache.downloadTool(downloadUrl);
	const tarpaulinBinPath = await toolCache.extractTar(packagePath);

	core.addPath(tarpaulinBinPath);
}

async function getDownloadUrl(requestedVersion: string, triple: string) {
	const releaseEndpoint = 'https://api.github.com/repos/EdJoPaTo/website-stalker/releases';
	const releaseInfoUrl = requestedVersion === 'latest'
		? `${releaseEndpoint}/latest`
		: `${releaseEndpoint}/tags/${requestedVersion}`;

	core.info('Selected release url: ' + releaseInfoUrl);
	const releaseInfoRequest = await fetch(releaseInfoUrl);
	const releaseInfo = await releaseInfoRequest.json() as any;
	const asset = releaseInfo.assets
		.filter((asset: any) => asset.name.includes(triple))
		.find((asset: any) => asset.content_type === 'application/gzip');

	if (!asset) {
		throw new Error(`Couldn't find a release containing binaries for ${requestedVersion}`);
	}

	core.info('selected asset: ' + asset.name);

	const downloadUrl = asset.browser_download_url;
	core.info('download url: ' + downloadUrl);
	return downloadUrl;
}
