/**
 * Tests for the Task class.
 */
import chai, {should} from 'chai';
import chaiThings from 'chai-things';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiThings);
chai.use(chaiAsPromised);
should();
const expect = chai.expect;
const assert = chai.assert;
import sinon from 'sinon';

import testUtils from './utils/testUtils.js';
import Task from '../src/Task';
import Service from '../src/Service';
import GSF from '../src/GSF';

import testTasks from './utils/testTasks.js';
import interfaces from './utils/interfaces.js';
import config from './config/config.js';

let task;
let client;

/**
 * Begin tests
 */
// Avoid using arrow functions with mocha:
//  http://mochajs.org/#arrow-functions
describe('Testing Task class', function() {
  before(function(done) {
    client = GSF.client(config.localHTTPServer);
    task = new Task(client.service(testTasks.sleepTask.service),
      testTasks.sleepTask.name);
    done();
  });

  // ==========================================================
  describe('Task() constructor', function() {
    it('returns a valid task object', function(done) {
      expect(task).to.be.an('object');
      expect(task.name).to.equal(testTasks.sleepTask.name);
      done();
    });
    it('has a valid service property', function(done) {
      expect(task).to.be.an('object');
      expect(task.service).to.be.an.instanceof(Service);
      done();
    });
  });

  describe('.info()', function() {
    it('retrieves the task information', function() {
      this.timeout(config.testTimeout1);
      return task
        .info()
        .then((info) => {
          testUtils.verifyProperties(info, interfaces.taskInfo);
          expect(info.inputParameters).to.be.an('array');
          expect(info.outputParameters).to.be.an('array');
          [...info.inputParameters,
            ...info.outputParameters].forEach((param) => {
            testUtils.verifyProperties(param, interfaces.taskParameters);
          });
        });
    });

    it('rejects promise if error from request', function() {
      this.timeout(config.testTimeout2);

      const badTask = GSF.client(config.fakeServer)
        .service(testTasks.sleepTask.service)
        .task(testTasks.sleepTask.name);

      return assert.isRejected(badTask.info(),
        /Error requesting task info/);
    });

  });

  describe('.submit()', function() {
    it('submits a job', function() {
      this.timeout(config.testTimeout1);
      const submitJob = task.submit({inputParameters: testTasks.sleepTask.parameters});
      return Promise.all([
        expect(submitJob).to.eventually.be.fulfilled,
        expect(submitJob).to.eventually.be.an('Object'),
        expect(submitJob).to.eventually.have.property('jobId')
      ]);
    });

    it('submits a job with progress and started callbacks', function() {
      this.timeout(config.testTimeout2);
      const params = {
        ...testTasks.sleepTask.parameters,
        N_PROGRESS: 5,
        SLEEP_TIME: 400,
        PROGRESS_MESSAGE: 'Message'
      };

      let sleepParams = {...params, SLEEP_TIME: 100};

      const progress = sinon.spy();
      const started = sinon.spy();

      // Submit a two jobs so we have one that gets queued.
      // That will ensure that there is a started event.
      // Workers needs to be set to 1 in the server config for this to pass.
      return task.submit({inputParameters: params}).then(function(job) {

        // At this point, we are sure that the first job has been accepted
        // Submit the second job and verify we get the right callbacks
        return task
          .submit({inputParameters: sleepParams}, progress, started)
          .then(job => job.wait())
          .then((result) => {
            expect(progress.callCount).to.equal(params.N_PROGRESS);
            assert(started.calledOnce);
            const args = progress.args.map((arg) => (arg[0]));
            (args).should.all.have.property('message');
            (args).should.all.have.property('jobId');
            (args).should.all.have.property('progress');
          });
      });
    });

    it('rejects promise if error from request', function() {
      this.timeout(config.testTimeout2);

      const badServer = GSF.client(config.fakeServer);
      const badTask = new Task(badServer.service(testTasks.sleepTask.service),
        testTasks.sleepTask.name);
      const badSubmit = badTask.submit({inputParameters: testTasks.sleepTask.parameters});
      return assert.isRejected(badSubmit,
        /Error submitting job/);
    });

  });

  describe('.submitAndWait()', function() {
    it('submits a job and waits for results', function(done) {
      this.timeout(config.testTimeout1);
      const submitAndWait = task.submitAndWait(
        {
          inputParameters: testTasks.sleepTask.parameters
        }
      );
      expect(submitAndWait).to.eventually.deep.equal(testTasks.sleepTask.results);
      done();
    });

    it('submits a job and waits for results with progress and started callbacks', function() {
      this.timeout(config.testTimeout1);
      const params = {
        ...testTasks.sleepTask.parameters,
        N_PROGRESS: 5,
        SLEEP_TIME: 500,
        PROGRESS_MESSAGE: 'Message'
      };

      let sleepParams = {...params, SLEEP_TIME: 100};

      const startedCallback = sinon.spy();
      const progressCallback = sinon.spy();

      // Submit a two jobs so we have one that gets queued.
      // That will ensure that there is a started event.
      // Workers needs to be set to 1 in the server config for this to pass.
      return task.submit({inputParameters: params}).then((job) => {

        // At this point, we are sure that the first job has been accepted
        // Submit the second job and verify we get the right callbacks
        task
          .submitAndWait({inputParameters: sleepParams}, progressCallback, startedCallback)
          .then((result) => {
            expect(startedCallback.calledOnce).to.be.true;
            expect(progressCallback.callCount).to.equal(params.N_PROGRESS);
            const args = progressCallback.args.map((arg) => (arg[0]));
            const progress = args.map((arg) => (arg.progress));
            (args).should.all.have.property('message', params.PROGRESS_MESSAGE);
            (progress).should.all.have.be.above(-1);
            (progress).should.all.have.be.below(100);
          });
      });
    });

    it('rejects promise if job fails', function(done) {
      this.timeout(config.testTimeout1);
      const failJob = task.submitAndWait({inputParameters: testTasks.sleepTaskFail.parameters});
      assert.isRejected(failJob,
        new RegExp(testTasks.sleepTaskFail.parameters.ERROR_MESSAGE));
      done();
    });

    it('submits multiple jobs with varying processing times', function() {
      this.timeout(config.testTimeout1);

      const progressCallback1 = sinon.spy();
      const progressCallback2 = sinon.spy();

      const parameters1 = {...testTasks.sleepTask.parameters, N_PROGRESS: 3, INPUT_INTEGER: 1, SLEEP_TIME: 50};
      const parameters2 = {...parameters1, INPUT_INTEGER: 2, N_PROGRESS: 12, SLEEP_TIME: 350};

      const runJob1 = task.submitAndWait({inputParameters: parameters1}, progressCallback1);
      const runJob2 = task.submitAndWait({inputParameters: parameters2}, progressCallback2);

      Promise.all([runJob1, runJob2])
        .then(function(output) {
          const results1 = output[0];
          const results2 = output[1];
          expect(results1).to.be.an('object');
          expect(results1).to.deep.equal({OUTPUT: {best: 1}});
          expect(results2).to.be.an('object');
          expect(results2).to.deep.equal({OUTPUT: {best: 2}});
          expect(progressCallback1.callCount).to.equal(parameters1.N_PROGRESS);
          expect(progressCallback2.callCount).to.equal(parameters2.N_PROGRESS);
          const args = progressCallback1.args.map((arg) => (arg[0]));
          (args).should.all.have.property('message');
          (args).should.all.have.property('jobId');
          (args).should.all.have.property('progress');
        });
      return;
    });

  });

});
