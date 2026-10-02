import { Scope } from '@nestjs/common';
import { InstanceWrapper } from '../injector/instance-wrapper.js';

export function isStaticHost(
  instanceWrapper: InstanceWrapper,
  globalScopedEnhancers: InstanceWrapper[] = [],
): boolean {
  if (instanceWrapper.scope === Scope.REQUEST) {
    return false;
  }
  if (instanceWrapper.isDependencyTreeStatic()) {
    return true;
  }
  if (!instanceWrapper.isHostDependencyTreeStatic()) {
    return false;
  }
  const enhancers = instanceWrapper.getEnhancersMetadata() || [];
  if (!enhancers.length) {
    return false;
  }
  const isGlobalEnhancer = (wrapper: InstanceWrapper) =>
    globalScopedEnhancers.some(
      global =>
        global === wrapper ||
        global.id === wrapper.id ||
        global.token === wrapper.token ||
        (!!global.metatype &&
          !!wrapper.metatype &&
          global.metatype === wrapper.metatype),
    );
  if (!enhancers.every(isGlobalEnhancer)) {
    return false;
  }
  const dependencies = instanceWrapper.getCtorMetadata() || [];
  const properties = instanceWrapper.getPropertiesMetadata() || [];
  const injectionWrappers = [
    ...dependencies,
    ...properties.map(({ wrapper }) => wrapper),
  ];
  return injectionWrappers.every(wrapper => wrapper.isDependencyTreeStatic());
}
