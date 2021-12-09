import axios from 'axios';
import logger from '../utils/logger';
import { RsError } from '../utils/errors';
const SabreAccessToken =
	'T1RLAQJNF37B1NsaGXzWrNnAvqjlNzh4qYFVk+I9Zd7z2k4ehRAn7cof5yX9N70uTSuCaT46AAEQK/Pvx1GWQ0xaKwli1herjPzmo2VTXsOXbJ88wodeDHBUAMh1DlMEr9WJQ5FxivO7U1pheIzHbqfCcGckQWgSwHx0GALmbyoLG/lGN1TDIF7hPSjxdVuTeiioJhZClVipdgGm+qIhS0VQnNmsIdbfHr2coIS6cV2NLExlGu/EIHbuJKzN/1V9FFVppJpPSwmgh0aSOHSHo+J7qdaSP1RldX8SWEjLLK8/xmdSCYEC483IERlFGxAdtGsxkFXR9tfZvVuL/wDHfvSdpn6OQHW42OijUEV7QaUU06Qcs20s3I1MLl1dPTirurGRfcXh6Y03RmSq9tFIHuUWZamm+b0QIo2yELxwIdfRX31oPS8JeoQ*';

const getHotelList = async () => {
	const result = await get(`https://bus-cuat.synxis.com/v1/api/hotel/list?chainId=14160230`, {
		headers: { Authorization: `Bearer ${SabreAccessToken}` }
	}).catch(handleResponse);
	logger.info(JSON.stringify(result));
};

const get = async (url, config) => {
	let result;
	try {
		result = await axios.get(url, config);
	} catch (e) {
		result = e.response;
	}
	return handleResponse(result);
};

function handleResponse(result) {
	if (!result || result.status === 500) {
		logger.error(JSON.stringify(result));
		throw new RsError('BAD_REQUEST');
	}
	if (result.status >= 400 && result.status <= 499) {
		logger.error(result.status);
		logger.error(JSON.stringify(result.data));
		throw new RsError('BAD_REQUEST', JSON.stringify(result.data));
	}
	if (result.status >= 200 && result.status <= 399) {
		return result.data;
	}
}

(async () => {
	for (let i = 0; i < 1000; i++) {
		getHotelList();
	}
})();
