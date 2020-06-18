import { Component } from 'inferno';

function eq(a, b) {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }

  return false;
}

class HookTracker {
  constructor() {
    this.id = 0;
    this.hookInstances = [];
  }

  beginRender() {
    this.id = 0;
  }

  nextId() {
    return this.id++;
  }

  createHook(hook) {
    return (fn, watchList) => {
      const id = this.nextId();
      let inst = this.hookInstances[id];

      if (inst && eq(inst.watchList, watchList)) {
        return inst.value;
      }

      if (inst && inst.dispose) {
        inst.dispose();
      }

      const result = hook(fn);
      this.hookInstances[id] = {
        watchList,
        dispose: result.dispose,
        get value() {
          return result.value;
        },
      };
      return result.value;
    };
  }

  dispose() {
    this.hookInstances.forEach((inst) => {
      return inst && inst.dispose && inst.dispose();
    });
  }
}

class HookComponent extends Component {
  constructor(props, context) {
    super(props, context);
    this.tracker = new HookTracker();
    const me = this;
    const setState = (setter) => {
      return me.setState((s) => ({
        value: typeof setter === 'function' ? setter(s.value) : setter,
      }));
    };

    this.hooks = {
      useDisposable: me.tracker.createHook((fn) => fn()),

      useMemo: me.tracker.createHook((fn) => ({ value: fn() })),

      useEffect: me.tracker.createHook((fn) => ({ dispose: fn() })),

      useState: me.tracker.createHook((initialState) => {
        me.state = {
          value: typeof initialState === 'function' ? initialState(props) : initialState,
        };
        return {
          get value() {
            return [me.state.value, setState];
          },
        };
      }),
    };
  }

  componentWillUnmount() {
    this.tracker.dispose();
  }

  render() {
    this.tracker.beginRender();
    return this.props.render(this.props.props, this.hooks);
  }
}

export function comp(render) {
  return (props) => <HookComponent props={props} render={render} />;
}
