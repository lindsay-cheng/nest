import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  Injectable,
  Scope,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

@Injectable()
class Tracker {
  guards: object[] = [];
  allow = true;
}

@Injectable()
class GlobalGuard implements CanActivate {
  private readonly constructed = true;

  constructor(private readonly tracker: Tracker) {}

  canActivate(_context: ExecutionContext) {
    expect(this.constructed).toBe(true);
    this.tracker.guards.push(this);
    return this.tracker.allow;
  }
}

@Controller()
class AppController {
  private sequence = 0;

  @Get()
  getRoot() {
    return { sequence: ++this.sequence };
  }
}

describe('HTTP global scoped enhancers', () => {
  let app: INestApplication;
  let tracker: Tracker;

  async function start(scope: Scope) {
    const testingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        Tracker,
        { provide: APP_GUARD, useClass: GlobalGuard, scope },
      ],
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
    tracker = app.get(Tracker);
  }

  afterEach(async () => {
    await app?.close();
  });

  for (const scope of [Scope.REQUEST, Scope.TRANSIENT]) {
    it(`should run a denying global ${Scope[scope]} guard on a static controller`, async () => {
      await start(scope);
      tracker.allow = false;

      await request(app.getHttpServer()).get('/').expect(403);
      expect(tracker.guards).toHaveLength(1);
    });

    it(`should reuse ${Scope[scope]} global guards per request and preserve singleton controller state`, async () => {
      await start(scope);

      const first = await request(app.getHttpServer()).get('/').expect(200);
      const second = await request(app.getHttpServer()).get('/').expect(200);

      expect(first.body).toEqual({ sequence: 1 });
      expect(second.body).toEqual({ sequence: 2 });
      expect(tracker.guards).toHaveLength(2);
      expect(tracker.guards[0]).not.toBe(tracker.guards[1]);
    });
  }
});
