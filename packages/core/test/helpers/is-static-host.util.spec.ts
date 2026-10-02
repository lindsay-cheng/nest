import { Scope } from '@nestjs/common';
import { isStaticHost } from '../../helpers/is-static-host.util.js';
import { InstanceWrapper } from '../../injector/instance-wrapper.js';

describe('isStaticHost', () => {
  it('should match global enhancers attached to controllers by token', () => {
    class GlobalGuard {}
    const controller = new InstanceWrapper({
      metatype: class {},
      scope: Scope.DEFAULT,
    });
    const globalGuard = new InstanceWrapper({
      token: GlobalGuard,
      metatype: GlobalGuard,
      scope: Scope.REQUEST,
    });
    const attachedGuard = new InstanceWrapper({
      token: GlobalGuard,
      metatype: GlobalGuard,
      scope: Scope.REQUEST,
    });
    controller.addEnhancerMetadata(attachedGuard);

    expect(isStaticHost(controller, [globalGuard])).toBe(true);
  });

  it('should treat a default-scoped controller as static when only global scoped enhancers are attached', () => {
    const controller = new InstanceWrapper({
      metatype: class {},
      scope: Scope.DEFAULT,
    });
    const globalGuard = new InstanceWrapper({
      scope: Scope.REQUEST,
    });
    controller.addEnhancerMetadata(globalGuard);

    expect(controller.isDependencyTreeStatic()).toBe(false);
    expect(isStaticHost(controller, [globalGuard])).toBe(true);
  });

  it('should treat request-scoped controllers as non-static hosts', () => {
    const controller = new InstanceWrapper({
      scope: Scope.REQUEST,
    });

    expect(isStaticHost(controller, [])).toBe(false);
  });
});
