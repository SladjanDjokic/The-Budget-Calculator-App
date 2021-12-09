import chai from 'chai';

import { ImportMock } from 'ts-mock-imports';
import * as agendaJsMocks from '../../integrations/agenda/agendaJs';
import AgendaMock from '../../integrations/agenda/AgendaMock';

let agendaMock = new AgendaMock();
// @ts-ignore
const mockManager = ImportMock.mockOther(agendaJsMocks, 'default', agendaMock);

import EmailService from '../../services/email/email.service';

import emailResource from '../resources/email.service.resource';
import serviceFactory from '../../services/serviceFactory';

describe('EmailService', function () {
	before(function () {
		// Since agenda mock could have been replaced on other service tests, replace it again just in case
		// @ts-ignore
		mockManager.set(agendaMock);
	});
	beforeEach(function () {
		agendaMock.resetCounts();
	});

	describe('Send Email', function () {
		it('should schedule an email for a future run', async function () {
			const emailService = serviceFactory.get<EmailService>('EmailService');
			await emailService.sendDelayed(emailResource.sendDelayed);
			chai.expect(agendaMock.nowCalledCount).to.equal(0);
			chai.expect(agendaMock.scheduleCalledCount).to.equal(1);
			chai.expect(agendaMock.lastScheduleTime instanceof Date).to.be.true;
			chai.expect((agendaMock.lastScheduleTime as Date).getTime()).to.equal(
				emailResource.sendDelayed.sendOn.getTime()
			);
			chai.expect(agendaMock.lastJobNameCalled).to.equal('EmailJob');
			chai.expect(agendaMock.lastAgendaData.sentFromEmail).to.equal('noreply@spireloyalty.com');
			chai.expect(agendaMock.lastAgendaData.sentToEmail).to.equal('joshua.hintze@gmail.com');
		});

		it('should send an email immediately', async function () {
			const emailService = serviceFactory.get<EmailService>('EmailService');
			await emailService.sendImmediate(emailResource.sendImmediate);
			chai.expect(agendaMock.nowCalledCount).to.equal(1);
			chai.expect(agendaMock.scheduleCalledCount).to.equal(0);
			chai.expect(agendaMock.lastJobNameCalled).to.equal('EmailJob');
			chai.expect(agendaMock.lastAgendaData.sentFromEmail).to.equal('noreply@spireloyalty.com');
			chai.expect(agendaMock.lastAgendaData.sentToEmail).to.equal('joshua.hintze@gmail.com');
		});
	});
});
