import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IHookFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-core';

import {
	IDataObject,
	INodeErrorPath,
} from 'n8n-workflow';

/**
 * Make an API request to Spotify
 *
 * @param {IHookFunctions} this
 * @param {string} method
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
export async function spotifyApiRequest(this: IHookFunctions | IExecuteFunctions,
	method: string, endpoint: string, body: object, query?: object, uri?: string): Promise<any> { // tslint:disable-line:no-any

	const options: OptionsWithUri = {
		method,
		headers: {
			'User-Agent': 'n8n',
			'Content-Type': 'text/plain',
			'Accept': ' application/json',
		},
		body,
		qs: query,
		uri: uri || `https://api.spotify.com/v1${endpoint}`,
		json: true,
	};

	try {
		const credentials = this.getCredentials('spotifyOAuth2Api');

		if (credentials === undefined) {
			throw new NodeOperationError('Spotify', 'No credentials got returned!');
		}

		if (Object.keys(body).length === 0) {
			delete options.body;
		}

		return await this.helpers.requestOAuth2.call(this, 'spotifyOAuth2Api', options);
	} catch (error) {

		const path: INodeErrorPath = {
			code: ['error', 'error', 'status'],
			message: ['error', 'error', 'message'],
		};

		throw new NodeApiError('Spotify', error);
	}
}

export async function spotifyApiRequestAllItems(this: IHookFunctions | IExecuteFunctions,
	propertyName: string, method: string, endpoint: string, body: object, query?: object): Promise<any> { // tslint:disable-line:no-any

	const returnData: IDataObject[] = [];

	let responseData;

	let uri: string | undefined;

	do {
		responseData = await spotifyApiRequest.call(this, method, endpoint, body, query, uri);
		returnData.push.apply(returnData, responseData[propertyName]);
		uri = responseData.next;

	} while (
		responseData['next'] !== null
	);

	return returnData;
}
