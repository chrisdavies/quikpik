
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var quikpik = (function () {
	'use strict';

	function noop() {}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function empty() {
		return text('');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function set_style(node, key, value) {
		node.style.setProperty(key, value);
	}

	function toggle_class(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	const dirty_components = [];

	let update_promise;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_promise) {
			update_promise = Promise.resolve();
			update_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_promise = null;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	/* lib/file-picker.svelte generated by Svelte v3.0.0 */

	const file = "lib/file-picker.svelte";

	function add_css() {
		var style = element("style");
		style.id = 'svelte-1m0xcl2-style';
		style.textContent = ".quikpik-filepicker.svelte-1m0xcl2{display:flex;flex-direction:column;justify-content:center;align-items:center;border-radius:0.375rem;padding:2rem;flex-grow:1}.quikpik-drop-target.svelte-1m0xcl2{background:#ebf4ff}.quikpik-icon.svelte-1m0xcl2{color:#9fa6b2;width:3rem;height:3rem}.quikpik-header.svelte-1m0xcl2{color:#161e2e;line-height:1.5rem;font-size:1.125rem;font-weight:500;margin:0;margin-top:1.25rem}.quikpik-text.svelte-1m0xcl2{display:block;color:#6b7280;line-height:1.25rem;max-width:75%;margin:0.5rem auto 1.5rem}.quikpik-action.svelte-1m0xcl2{display:block;background:#5a67d8;color:#fff;border:0;padding:0.5rem 0.75rem;font-size:0.875rem;border-radius:0.375rem;cursor:pointer}.quikpik-action.svelte-1m0xcl2:active,.quikpik-action.svelte-1m0xcl2:focus{outline:none;box-shadow:0 0 0 3px rgba(180, 198, 252, 0.45)}.quikpik-input.svelte-1m0xcl2{position:absolute;top:-10000px;left:-10000px;width:1px;overflow:hidden;z-index:1}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1waWNrZXIuc3ZlbHRlIiwic291cmNlcyI6WyJmaWxlLXBpY2tlci5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB1cGxvYWRGaWxlO1xuXG4gIGxldCBpc0Ryb3BUYXJnZXQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBvbkRyYWdPdmVyKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpc0Ryb3BUYXJnZXQgPSB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25EcmFnRW5kKCkge1xuICAgIGlzRHJvcFRhcmdldCA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ecm9wKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIHVwbG9hZEZpbGUoZS5kYXRhVHJhbnNmZXIuZmlsZXMgJiYgZS5kYXRhVHJhbnNmZXIuZmlsZXNbMF0pO1xuXG4gICAgb25EcmFnRW5kKCk7XG4gIH1cblxuICBmdW5jdGlvbiBvblBpY2soZSkge1xuICAgIHVwbG9hZEZpbGUoZS50YXJnZXQuZmlsZXNbMF0pXG4gIH1cbjwvc2NyaXB0PlxuXG48ZGl2XG4gIGNsYXNzPVwicXVpa3Bpay1maWxlcGlja2VyXCJcbiAgY2xhc3M6cXVpa3Bpay1kcm9wLXRhcmdldD17aXNEcm9wVGFyZ2V0fVxuICBvbjpkcmFnb3Zlcj17b25EcmFnT3Zlcn1cbiAgb246ZHJhZ2VuZD17b25EcmFnRW5kfVxuICBvbjpkcm9wPXtvbkRyb3B9XG4+XG4gIDxzdmcgY2xhc3M9XCJxdWlrcGlrLWljb25cIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBmaWxsPVwibm9uZVwiIHZpZXdCb3g9XCIwIDAgNDggNDhcIj5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0yOCA4SDEyYTQgNCAwIDAwLTQgNHYyMG0zMi0xMnY4bTAgMHY4YTQgNCAwIDAxLTQgNEgxMmE0IDQgMCAwMS00LTR2LTRtMzItNGwtMy4xNzItMy4xNzJhNCA0IDAgMDAtNS42NTYgMEwyOCAyOE04IDMybDkuMTcyLTkuMTcyYTQgNCAwIDAxNS42NTYgMEwyOCAyOG0wIDBsNCA0bTQtMjRoOG0tNC00djhtLTEyIDRoLjAyXCJcbiAgICAgIHN0cm9rZS13aWR0aD1cIjJcIlxuICAgICAgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiXG4gICAgPjwvcGF0aD5cbiAgPC9zdmc+XG4gIDxoMiBjbGFzcz1cInF1aWtwaWstaGVhZGVyXCI+VXBsb2FkIGEgZmlsZTwvaDI+XG4gIDxkaXYgY2xhc3M9XCJxdWlrcGlrLWluc3RydWN0aW9uc1wiPlxuICAgIDxzcGFuIGNsYXNzPVwicXVpa3Bpay10ZXh0XCI+XG4gICAgICBEcmFnIG9yIHBhc3RlIGEgZmlsZSBoZXJlLCBvciBjbGljayB0byBjaG9vc2UgYSBmaWxlIGZyb20geW91ciBjb21wdXRlci5cbiAgICA8L3NwYW4+XG4gICAgPGxhYmVsIGNsYXNzPVwicXVpa3Bpay1hY3Rpb25cIj5cbiAgICAgIENob29zZSBGaWxlXG4gICAgICA8aW5wdXRcbiAgICAgICAgY2xhc3M9XCJxdWlrcGlrLWlucHV0XCJcbiAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICBvbjpjaGFuZ2U9e29uUGlja31cbiAgICAgIC8+XG4gICAgPC9sYWJlbD5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlPlxuICAucXVpa3Bpay1maWxlcGlja2VyIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBib3JkZXItcmFkaXVzOiAwLjM3NXJlbTtcbiAgICBwYWRkaW5nOiAycmVtO1xuICAgIGZsZXgtZ3JvdzogMTtcbiAgfVxuXG4gIC5xdWlrcGlrLWRyb3AtdGFyZ2V0IHtcbiAgICBiYWNrZ3JvdW5kOiAjZWJmNGZmO1xuICB9XG5cbiAgLnF1aWtwaWstaWNvbiB7XG4gICAgY29sb3I6ICM5ZmE2YjI7XG4gICAgd2lkdGg6IDNyZW07XG4gICAgaGVpZ2h0OiAzcmVtO1xuICB9XG5cbiAgLnF1aWtwaWstaGVhZGVyIHtcbiAgICBjb2xvcjogIzE2MWUyZTtcbiAgICBsaW5lLWhlaWdodDogMS41cmVtO1xuICAgIGZvbnQtc2l6ZTogMS4xMjVyZW07XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICBtYXJnaW46IDA7XG4gICAgbWFyZ2luLXRvcDogMS4yNXJlbTtcbiAgfVxuXG4gIC5xdWlrcGlrLXRleHQge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIGNvbG9yOiAjNmI3MjgwO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjI1cmVtO1xuICAgIG1heC13aWR0aDogNzUlO1xuICAgIG1hcmdpbjogMC41cmVtIGF1dG8gMS41cmVtO1xuICB9XG5cbiAgLnF1aWtwaWstYWN0aW9uIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBiYWNrZ3JvdW5kOiAjNWE2N2Q4O1xuICAgIGNvbG9yOiAjZmZmO1xuICAgIGJvcmRlcjogMDtcbiAgICBwYWRkaW5nOiAwLjVyZW0gMC43NXJlbTtcbiAgICBmb250LXNpemU6IDAuODc1cmVtO1xuICAgIGJvcmRlci1yYWRpdXM6IDAuMzc1cmVtO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuXG4gIC5xdWlrcGlrLWFjdGlvbjphY3RpdmUsXG4gIC5xdWlrcGlrLWFjdGlvbjpmb2N1cyB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAzcHggcmdiYSgxODAsIDE5OCwgMjUyLCAwLjQ1KTtcbiAgfVxuXG4gIC5xdWlrcGlrLWlucHV0IHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgdG9wOiAtMTAwMDBweDtcbiAgICBsZWZ0OiAtMTAwMDBweDtcbiAgICB3aWR0aDogMXB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgei1pbmRleDogMTtcbiAgfVxuPC9zdHlsZT4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNkRFLG1CQUFtQixlQUFDLENBQUMsQUFDbkIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixlQUFlLENBQUUsTUFBTSxDQUN2QixXQUFXLENBQUUsTUFBTSxDQUNuQixhQUFhLENBQUUsUUFBUSxDQUN2QixPQUFPLENBQUUsSUFBSSxDQUNiLFNBQVMsQ0FBRSxDQUFDLEFBQ2QsQ0FBQyxBQUVELG9CQUFvQixlQUFDLENBQUMsQUFDcEIsVUFBVSxDQUFFLE9BQU8sQUFDckIsQ0FBQyxBQUVELGFBQWEsZUFBQyxDQUFDLEFBQ2IsS0FBSyxDQUFFLE9BQU8sQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUVELGVBQWUsZUFBQyxDQUFDLEFBQ2YsS0FBSyxDQUFFLE9BQU8sQ0FDZCxXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsUUFBUSxDQUNuQixXQUFXLENBQUUsR0FBRyxDQUNoQixNQUFNLENBQUUsQ0FBQyxDQUNULFVBQVUsQ0FBRSxPQUFPLEFBQ3JCLENBQUMsQUFFRCxhQUFhLGVBQUMsQ0FBQyxBQUNiLE9BQU8sQ0FBRSxLQUFLLENBQ2QsS0FBSyxDQUFFLE9BQU8sQ0FDZCxXQUFXLENBQUUsT0FBTyxDQUNwQixTQUFTLENBQUUsR0FBRyxDQUNkLE1BQU0sQ0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQUFDNUIsQ0FBQyxBQUVELGVBQWUsZUFBQyxDQUFDLEFBQ2YsT0FBTyxDQUFFLEtBQUssQ0FDZCxVQUFVLENBQUUsT0FBTyxDQUNuQixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxDQUFDLENBQ1QsT0FBTyxDQUFFLE1BQU0sQ0FBQyxPQUFPLENBQ3ZCLFNBQVMsQ0FBRSxRQUFRLENBQ25CLGFBQWEsQ0FBRSxRQUFRLENBQ3ZCLE1BQU0sQ0FBRSxPQUFPLEFBQ2pCLENBQUMsQUFFRCw4QkFBZSxPQUFPLENBQ3RCLDhCQUFlLE1BQU0sQUFBQyxDQUFDLEFBQ3JCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxBQUNqRCxDQUFDLEFBRUQsY0FBYyxlQUFDLENBQUMsQUFDZCxRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsUUFBUSxDQUNiLElBQUksQ0FBRSxRQUFRLENBQ2QsS0FBSyxDQUFFLEdBQUcsQ0FDVixRQUFRLENBQUUsTUFBTSxDQUNoQixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMifQ== */";
		append(document.head, style);
	}

	function create_fragment(ctx) {
		var div1, svg, path, t0, h2, t2, div0, span, t4, label, t5, input, dispose;

		return {
			c: function create() {
				div1 = element("div");
				svg = svg_element("svg");
				path = svg_element("path");
				t0 = space();
				h2 = element("h2");
				h2.textContent = "Upload a file";
				t2 = space();
				div0 = element("div");
				span = element("span");
				span.textContent = "Drag or paste a file here, or click to choose a file from your computer.";
				t4 = space();
				label = element("label");
				t5 = text("Choose File\n      ");
				input = element("input");
				attr(path, "d", "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02");
				attr(path, "stroke-width", "2");
				attr(path, "stroke-linecap", "round");
				attr(path, "stroke-linejoin", "round");
				add_location(path, file, 37, 4, 672);
				attr(svg, "class", "quikpik-icon svelte-1m0xcl2");
				attr(svg, "stroke", "currentColor");
				attr(svg, "fill", "none");
				attr(svg, "viewBox", "0 0 48 48");
				add_location(svg, file, 36, 2, 587);
				h2.className = "quikpik-header svelte-1m0xcl2";
				add_location(h2, file, 44, 2, 977);
				span.className = "quikpik-text svelte-1m0xcl2";
				add_location(span, file, 46, 4, 1064);
				input.className = "quikpik-input svelte-1m0xcl2";
				attr(input, "type", "file");
				add_location(input, file, 51, 6, 1242);
				label.className = "quikpik-action svelte-1m0xcl2";
				add_location(label, file, 49, 4, 1187);
				div0.className = "quikpik-instructions";
				add_location(div0, file, 45, 2, 1025);
				div1.className = "quikpik-filepicker svelte-1m0xcl2";
				toggle_class(div1, "quikpik-drop-target", ctx.isDropTarget);
				add_location(div1, file, 29, 0, 435);

				dispose = [
					listen(input, "change", ctx.onPick),
					listen(div1, "dragover", ctx.onDragOver),
					listen(div1, "dragend", ctx.onDragEnd),
					listen(div1, "drop", ctx.onDrop)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, svg);
				append(svg, path);
				append(div1, t0);
				append(div1, h2);
				append(div1, t2);
				append(div1, div0);
				append(div0, span);
				append(div0, t4);
				append(div0, label);
				append(label, t5);
				append(label, input);
			},

			p: function update(changed, ctx) {
				if (changed.isDropTarget) {
					toggle_class(div1, "quikpik-drop-target", ctx.isDropTarget);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				run_all(dispose);
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { uploadFile } = $$props;

	  let isDropTarget = false;

	  function onDragOver(e) {
	    e.preventDefault();

	    $$invalidate('isDropTarget', isDropTarget = true);
	  }

	  function onDragEnd() {
	    $$invalidate('isDropTarget', isDropTarget = false);
	  }

	  function onDrop(e) {
	    e.preventDefault();
	    e.stopPropagation();

	    uploadFile(e.dataTransfer.files && e.dataTransfer.files[0]);

	    onDragEnd();
	  }

	  function onPick(e) {
	    uploadFile(e.target.files[0]);
	  }

		$$self.$set = $$props => {
			if ('uploadFile' in $$props) $$invalidate('uploadFile', uploadFile = $$props.uploadFile);
		};

		return {
			uploadFile,
			isDropTarget,
			onDragOver,
			onDragEnd,
			onDrop,
			onPick
		};
	}

	class File_picker extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1m0xcl2-style")) add_css();
			init(this, options, instance, create_fragment, safe_not_equal, ["uploadFile"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.uploadFile === undefined && !('uploadFile' in props)) {
				console.warn("<File_picker> was created without expected prop 'uploadFile'");
			}
		}

		get uploadFile() {
			throw new Error("<File_picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set uploadFile(value) {
			throw new Error("<File_picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* lib/upload-progress.svelte generated by Svelte v3.0.0 */

	const file_1 = "lib/upload-progress.svelte";

	function add_css$1() {
		var style = element("style");
		style.id = 'svelte-1rilkaq-style';
		style.textContent = ".quikpik-progress.svelte-1rilkaq{width:100%}.quikpik-progress-text.svelte-1rilkaq{display:flex;justify-content:space-between;color:#6b7280;line-height:1.25rem;margin:0.5rem auto 0.5rem}.quikpik-progress-bar.svelte-1rilkaq,.quikpik-progress-bar-wrapper.svelte-1rilkaq{display:block;background:#c3dafe;height:8px;border-radius:4px}.quikpik-progress-bar.svelte-1rilkaq{background:#667eea;width:0;transition:width 0.25s, background-color 0.5s}.quikpik-done-bar.svelte-1rilkaq{background:#48bb78}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLXByb2dyZXNzLnN2ZWx0ZSIsInNvdXJjZXMiOlsidXBsb2FkLXByb2dyZXNzLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBleHBvcnQgbGV0IGZpbGU7XG4gIGV4cG9ydCBsZXQgcHJvZ3Jlc3M7XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInF1aWtwaWstcHJvZ3Jlc3NcIj5cbiAgPHNwYW4gY2xhc3M9XCJxdWlrcGlrLXByb2dyZXNzLXRleHRcIj5cbiAgICA8c3BhbiBjbGFzcz1cInF1aWtwaWstZmlsZW5hbWVcIj5VcGxvYWRpbmcge2ZpbGUubmFtZSB8fCAnJ308L3NwYW4+XG4gICAgPHNwYW4gY2xhc3M9XCJxdWlrcGlrLXBlcmNlbnRcIj57TWF0aC5yb3VuZChwcm9ncmVzcyl9JTwvc3Bhbj5cbiAgPC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cInF1aWtwaWstcHJvZ3Jlc3MtYmFyLXdyYXBwZXJcIj5cbiAgICA8c3BhblxuICAgICAgY2xhc3M9XCJxdWlrcGlrLXByb2dyZXNzLWJhclwiXG4gICAgICBjbGFzczpxdWlrcGlrLWRvbmUtYmFyPXtwcm9ncmVzcyA+PSAxMDB9XG4gICAgICBzdHlsZT1cIndpZHRoOiB7cHJvZ3Jlc3N9JVwiXG4gICAgLz5cbiAgPC9zcGFuPlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLnF1aWtwaWstcHJvZ3Jlc3Mge1xuICAgIHdpZHRoOiAxMDAlO1xuICB9XG5cbiAgLnF1aWtwaWstcHJvZ3Jlc3MtdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgY29sb3I6ICM2YjcyODA7XG4gICAgbGluZS1oZWlnaHQ6IDEuMjVyZW07XG4gICAgbWFyZ2luOiAwLjVyZW0gYXV0byAwLjVyZW07XG4gIH1cblxuICAucXVpa3Bpay1wcm9ncmVzcy1iYXIsXG4gIC5xdWlrcGlrLXByb2dyZXNzLWJhci13cmFwcGVyIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBiYWNrZ3JvdW5kOiAjYzNkYWZlO1xuICAgIGhlaWdodDogOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgfVxuXG4gIC5xdWlrcGlrLXByb2dyZXNzLWJhciB7XG4gICAgYmFja2dyb3VuZDogIzY2N2VlYTtcbiAgICB3aWR0aDogMDtcbiAgICB0cmFuc2l0aW9uOiB3aWR0aCAwLjI1cywgYmFja2dyb3VuZC1jb2xvciAwLjVzO1xuICB9XG5cbiAgLnF1aWtwaWstZG9uZS1iYXIge1xuICAgIGJhY2tncm91bmQ6ICM0OGJiNzg7XG4gIH1cbjwvc3R5bGU+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW9CRSxpQkFBaUIsZUFBQyxDQUFDLEFBQ2pCLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQUVELHNCQUFzQixlQUFDLENBQUMsQUFDdEIsT0FBTyxDQUFFLElBQUksQ0FDYixlQUFlLENBQUUsYUFBYSxDQUM5QixLQUFLLENBQUUsT0FBTyxDQUNkLFdBQVcsQ0FBRSxPQUFPLENBQ3BCLE1BQU0sQ0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQUFDNUIsQ0FBQyxBQUVELG9DQUFxQixDQUNyQiw2QkFBNkIsZUFBQyxDQUFDLEFBQzdCLE9BQU8sQ0FBRSxLQUFLLENBQ2QsVUFBVSxDQUFFLE9BQU8sQ0FDbkIsTUFBTSxDQUFFLEdBQUcsQ0FDWCxhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDLEFBRUQscUJBQXFCLGVBQUMsQ0FBQyxBQUNyQixVQUFVLENBQUUsT0FBTyxDQUNuQixLQUFLLENBQUUsQ0FBQyxDQUNSLFVBQVUsQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxBQUNoRCxDQUFDLEFBRUQsaUJBQWlCLGVBQUMsQ0FBQyxBQUNqQixVQUFVLENBQUUsT0FBTyxBQUNyQixDQUFDIn0= */";
		append(document.head, style);
	}

	function create_fragment$1(ctx) {
		var div, span2, span0, t0, t1_value = ctx.file.name || '', t1, t2, span1, t3_value = Math.round(ctx.progress), t3, t4, t5, span4, span3;

		return {
			c: function create() {
				div = element("div");
				span2 = element("span");
				span0 = element("span");
				t0 = text("Uploading ");
				t1 = text(t1_value);
				t2 = space();
				span1 = element("span");
				t3 = text(t3_value);
				t4 = text("%");
				t5 = space();
				span4 = element("span");
				span3 = element("span");
				span0.className = "quikpik-filename";
				add_location(span0, file_1, 7, 4, 136);
				span1.className = "quikpik-percent";
				add_location(span1, file_1, 8, 4, 206);
				span2.className = "quikpik-progress-text svelte-1rilkaq";
				add_location(span2, file_1, 6, 2, 95);
				span3.className = "quikpik-progress-bar svelte-1rilkaq";
				set_style(span3, "width", "" + ctx.progress + "%");
				toggle_class(span3, "quikpik-done-bar", ctx.progress >= 100);
				add_location(span3, file_1, 11, 4, 327);
				span4.className = "quikpik-progress-bar-wrapper svelte-1rilkaq";
				add_location(span4, file_1, 10, 2, 279);
				div.className = "quikpik-progress svelte-1rilkaq";
				add_location(div, file_1, 5, 0, 62);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, span2);
				append(span2, span0);
				append(span0, t0);
				append(span0, t1);
				append(span2, t2);
				append(span2, span1);
				append(span1, t3);
				append(span1, t4);
				append(div, t5);
				append(div, span4);
				append(span4, span3);
			},

			p: function update(changed, ctx) {
				if ((changed.file) && t1_value !== (t1_value = ctx.file.name || '')) {
					set_data(t1, t1_value);
				}

				if ((changed.progress) && t3_value !== (t3_value = Math.round(ctx.progress))) {
					set_data(t3, t3_value);
				}

				if (changed.progress) {
					set_style(span3, "width", "" + ctx.progress + "%");
					toggle_class(span3, "quikpik-done-bar", ctx.progress >= 100);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { file, progress } = $$props;

		$$self.$set = $$props => {
			if ('file' in $$props) $$invalidate('file', file = $$props.file);
			if ('progress' in $$props) $$invalidate('progress', progress = $$props.progress);
		};

		return { file, progress };
	}

	class Upload_progress extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1rilkaq-style")) add_css$1();
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["file", "progress"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.file === undefined && !('file' in props)) {
				console.warn("<Upload_progress> was created without expected prop 'file'");
			}
			if (ctx.progress === undefined && !('progress' in props)) {
				console.warn("<Upload_progress> was created without expected prop 'progress'");
			}
		}

		get file() {
			throw new Error("<Upload_progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set file(value) {
			throw new Error("<Upload_progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get progress() {
			throw new Error("<Upload_progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set progress(value) {
			throw new Error("<Upload_progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* lib/live-vid.svelte generated by Svelte v3.0.0 */

	const file$1 = "lib/live-vid.svelte";

	function add_css$2() {
		var style = element("style");
		style.id = 'svelte-1b1mj4o-style';
		style.textContent = ".quikpik-vid-wrapper.svelte-1b1mj4o{flex-grow:1}.quikpik-vid-wrapper.svelte-1b1mj4o{position:relative;width:100%;flex-grow:1}.quikpik-vid.svelte-1b1mj4o{position:absolute;height:100%;width:100%;margin:auto;left:50%;transform:translateX(-50%);border-radius:2px;outline:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS12aWQuc3ZlbHRlIiwic291cmNlcyI6WyJsaXZlLXZpZC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCByZWNvcmRlcjtcblxuICBsZXQgdmlkZW9FbDtcblxuICAkOiBpZiAodmlkZW9FbCkge1xuICAgIHZpZGVvRWwuc3JjT2JqZWN0ID0gcmVjb3JkZXIubGl2ZVNyYygpO1xuICAgIHZpZGVvRWwubXV0ZWQgPSB0cnVlO1xuICAgIHZpZGVvRWwuY29udHJvbHMgPSBmYWxzZTtcbiAgICB2aWRlb0VsLnBsYXkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF1dG9wbGF5KGVsKSB7XG4gICAgdmlkZW9FbCA9IGVsO1xuICB9XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInF1aWtwaWstdmlkLXdyYXBwZXJcIj5cbiAgPHZpZGVvXG4gICAgdXNlOmF1dG9wbGF5XG4gICAgY2xhc3M9XCJxdWlrcGlrLXZpZFwiXG4gID48L3ZpZGVvPlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLnF1aWtwaWstdmlkLXdyYXBwZXIge1xuICAgIGZsZXgtZ3JvdzogMTtcbiAgfVxuXG4gIC5xdWlrcGlrLXZpZC13cmFwcGVyIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgZmxleC1ncm93OiAxO1xuICB9XG5cbiAgLnF1aWtwaWstdmlkIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG1hcmdpbjogYXV0bztcbiAgICBsZWZ0OiA1MCU7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG48L3N0eWxlPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5QkUsb0JBQW9CLGVBQUMsQ0FBQyxBQUNwQixTQUFTLENBQUUsQ0FBQyxBQUNkLENBQUMsQUFFRCxvQkFBb0IsZUFBQyxDQUFDLEFBQ3BCLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEtBQUssQ0FBRSxJQUFJLENBQ1gsU0FBUyxDQUFFLENBQUMsQUFDZCxDQUFDLEFBRUQsWUFBWSxlQUFDLENBQUMsQUFDWixRQUFRLENBQUUsUUFBUSxDQUNsQixNQUFNLENBQUUsSUFBSSxDQUNaLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixJQUFJLENBQUUsR0FBRyxDQUNULFNBQVMsQ0FBRSxXQUFXLElBQUksQ0FBQyxDQUMzQixhQUFhLENBQUUsR0FBRyxDQUNsQixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMifQ== */";
		append(document.head, style);
	}

	function create_fragment$2(ctx) {
		var div, video, autoplay_action;

		return {
			c: function create() {
				div = element("div");
				video = element("video");
				video.className = "quikpik-vid svelte-1b1mj4o";
				add_location(video, file$1, 18, 2, 289);
				div.className = "quikpik-vid-wrapper svelte-1b1mj4o";
				add_location(div, file$1, 17, 0, 253);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, video);
				autoplay_action = ctx.autoplay.call(null, video) || {};
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if (autoplay_action && typeof autoplay_action.destroy === 'function') autoplay_action.destroy();
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { recorder } = $$props;

	  let videoEl;

	  function autoplay(el) {
	    $$invalidate('videoEl', videoEl = el);
	  }

		$$self.$set = $$props => {
			if ('recorder' in $$props) $$invalidate('recorder', recorder = $$props.recorder);
		};

		$$self.$$.update = ($$dirty = { videoEl: 1, recorder: 1 }) => {
			if ($$dirty.videoEl || $$dirty.recorder) { if (videoEl) {
	        videoEl.srcObject = recorder.liveSrc(); $$invalidate('videoEl', videoEl);
	        videoEl.muted = true; $$invalidate('videoEl', videoEl);
	        videoEl.controls = false; $$invalidate('videoEl', videoEl);
	        videoEl.play();
	      } }
		};

		return { recorder, autoplay };
	}

	class Live_vid extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1b1mj4o-style")) add_css$2();
			init(this, options, instance$2, create_fragment$2, safe_not_equal, ["recorder"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.recorder === undefined && !('recorder' in props)) {
				console.warn("<Live_vid> was created without expected prop 'recorder'");
			}
		}

		get recorder() {
			throw new Error("<Live_vid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set recorder(value) {
			throw new Error("<Live_vid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* lib/elapsed-time.svelte generated by Svelte v3.0.0 */

	const file$2 = "lib/elapsed-time.svelte";

	function add_css$3() {
		var style = element("style");
		style.id = 'svelte-1aqygfp-style';
		style.textContent = ".quikpik-elapsed-time.svelte-1aqygfp{position:absolute;left:calc(50% + 2.75rem);top:50%;margin-top:-0.5rem;line-height:1;opacity:0.8}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxhcHNlZC10aW1lLnN2ZWx0ZSIsInNvdXJjZXMiOlsiZWxhcHNlZC10aW1lLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbkRlc3Ryb3kgfSBmcm9tICdzdmVsdGUnO1xuXG4gIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gIGxldCBlbGFwc2VkVGltZSA9IGNvbXB1dGVFbGFwc2VkVGltZSgpO1xuXG4gIGxldCB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiB0aWNrKCkge1xuICAgIGlmICghdGltZW91dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVsYXBzZWRUaW1lID0gY29tcHV0ZUVsYXBzZWRUaW1lKHN0YXJ0VGltZSk7XG4gICAgdGltZW91dCA9IHNldFRpbWVvdXQodGljaywgMTAwMCk7XG4gIH0sIDEwMDApO1xuXG4gIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIHRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGNvbXB1dGVFbGFwc2VkVGltZSgpIHtcbiAgICBjb25zdCBlbGFwc2VkTXMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgIGNvbnN0IHNlYyA9IE1hdGguZmxvb3IoZWxhcHNlZE1zIC8gMTAwMCkgJSA2MDtcbiAgICBjb25zdCBtaW4gPSBNYXRoLmZsb29yKHNlYyAvIDYwKSAlIDYwO1xuICAgIGNvbnN0IGggPSBNYXRoLmZsb29yKG1pbiAvIDYwKTtcblxuICAgIHJldHVybiBgJHtoID8gaCArICc6JyA6ICcnfSR7bWluLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtzZWMudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cbjwvc2NyaXB0PlxuXG48c3BhbiBjbGFzcz1cInF1aWtwaWstZWxhcHNlZC10aW1lXCI+XG4gIFJlY29yZGluZyB7ZWxhcHNlZFRpbWV9XG48L3NwYW4+XG5cbjxzdHlsZT5cbiAgLnF1aWtwaWstZWxhcHNlZC10aW1lIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgbGVmdDogY2FsYyg1MCUgKyAyLjc1cmVtKTtcbiAgICB0b3A6IDUwJTtcbiAgICBtYXJnaW4tdG9wOiAtMC41cmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxO1xuICAgIG9wYWNpdHk6IDAuODtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtQ0UscUJBQXFCLGVBQUMsQ0FBQyxBQUNyQixRQUFRLENBQUUsUUFBUSxDQUNsQixJQUFJLENBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUN6QixHQUFHLENBQUUsR0FBRyxDQUNSLFVBQVUsQ0FBRSxPQUFPLENBQ25CLFdBQVcsQ0FBRSxDQUFDLENBQ2QsT0FBTyxDQUFFLEdBQUcsQUFDZCxDQUFDIn0= */";
		append(document.head, style);
	}

	function create_fragment$3(ctx) {
		var span, t0, t1;

		return {
			c: function create() {
				span = element("span");
				t0 = text("Recording ");
				t1 = text(ctx.elapsedTime);
				span.className = "quikpik-elapsed-time svelte-1aqygfp";
				add_location(span, file$2, 30, 0, 717);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
				append(span, t0);
				append(span, t1);
			},

			p: function update(changed, ctx) {
				if (changed.elapsedTime) {
					set_data(t1, ctx.elapsedTime);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(span);
				}
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		const startTime = Date.now();
	  let elapsedTime = computeElapsedTime();

	  let timeout = setTimeout(function tick() {
	    if (!timeout) {
	      return;
	    }

	    $$invalidate('elapsedTime', elapsedTime = computeElapsedTime());
	    $$invalidate('timeout', timeout = setTimeout(tick, 1000));
	  }, 1000);

	  onDestroy(() => {
	    clearTimeout(timeout);
	    $$invalidate('timeout', timeout = undefined);
	  });

	  function computeElapsedTime() {
	    const elapsedMs = Date.now() - startTime;
	    const sec = Math.floor(elapsedMs / 1000) % 60;
	    const min = Math.floor(sec / 60) % 60;
	    const h = Math.floor(min / 60);

	    return `${h ? h + ':' : ''}${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	  }

		return { elapsedTime };
	}

	class Elapsed_time extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1aqygfp-style")) add_css$3();
			init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
		}
	}

	/* lib/confirm-media.svelte generated by Svelte v3.0.0 */

	const file_1$1 = "lib/confirm-media.svelte";

	function add_css$4() {
		var style = element("style");
		style.id = 'svelte-1e0r97y-style';
		style.textContent = ".quikpik-confirm-item.svelte-1e0r97y{width:100%;max-width:100%;max-height:100%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybS1tZWRpYS5zdmVsdGUiLCJzb3VyY2VzIjpbImNvbmZpcm0tbWVkaWEuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSc7XG5cbiAgZXhwb3J0IGxldCBmaWxlO1xuICBjb25zdCBzcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xuXG4gIG9uRGVzdHJveSgoKSA9PiBVUkwucmV2b2tlT2JqZWN0VVJMKHNyYykpO1xuPC9zY3JpcHQ+XG5cbnsjaWYgZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ3ZpZGVvLycpIHx8IGZpbGUudHlwZS5zdGFydHNXaXRoKCdhdWRpby8nKX1cbiAgPGRpdiBjbGFzcz1cInF1aWtwaWstdmlkLXdyYXBwZXJcIj5cbiAgICA8dmlkZW8gY2xhc3M9XCJxdWlrcGlrLXZpZFwiIHNyYz17c3JjfSBtdXRlZD17ZmFsc2V9IGNvbnRyb2xzPXt0cnVlfT48L3ZpZGVvPlxuICA8L2Rpdj5cbns6ZWxzZX1cbiAgPGRpdiBjbGFzcz1cInF1aWtwaWstY29uZmlybS13cmFwcGVyXCI+XG4gICAgPGltZyBjbGFzcz1cInF1aWtwaWstY29uZmlybS1pdGVtXCIgc3JjPXtzcmN9IGFsdD1cIkNvbmZpcm1cIiAvPlxuICA8L2Rpdj5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgLnF1aWtwaWstY29uZmlybS1pdGVtIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgbWF4LWhlaWdodDogMTAwJTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvQkUscUJBQXFCLGVBQUMsQ0FBQyxBQUNyQixLQUFLLENBQUUsSUFBSSxDQUNYLFNBQVMsQ0FBRSxJQUFJLENBQ2YsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyJ9 */";
		append(document.head, style);
	}

	// (14:0) {:else}
	function create_else_block(ctx) {
		var div, img;

		return {
			c: function create() {
				div = element("div");
				img = element("img");
				img.className = "quikpik-confirm-item svelte-1e0r97y";
				img.src = ctx.src;
				img.alt = "Confirm";
				add_location(img, file_1$1, 15, 4, 413);
				div.className = "quikpik-confirm-wrapper";
				add_location(div, file_1$1, 14, 2, 371);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, img);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (10:0) {#if file.type.startsWith('video/') || file.type.startsWith('audio/')}
	function create_if_block(ctx) {
		var div, video;

		return {
			c: function create() {
				div = element("div");
				video = element("video");
				video.className = "quikpik-vid";
				video.src = ctx.src;
				video.muted = false;
				video.controls = true;
				add_location(video, file_1$1, 11, 4, 276);
				div.className = "quikpik-vid-wrapper";
				add_location(div, file_1$1, 10, 2, 238);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, video);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$4(ctx) {
		var if_block_anchor;

		function select_block_type(ctx) {
			if (ctx.file.type.startsWith('video/') || ctx.file.type.startsWith('audio/')) return create_if_block;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { file } = $$props;
	  const src = URL.createObjectURL(file);

	  onDestroy(() => URL.revokeObjectURL(src));

		$$self.$set = $$props => {
			if ('file' in $$props) $$invalidate('file', file = $$props.file);
		};

		return { file, src };
	}

	class Confirm_media extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1e0r97y-style")) add_css$4();
			init(this, options, instance$4, create_fragment$4, safe_not_equal, ["file"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.file === undefined && !('file' in props)) {
				console.warn("<Confirm_media> was created without expected prop 'file'");
			}
		}

		get file() {
			throw new Error("<Confirm_media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set file(value) {
			throw new Error("<Confirm_media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/**
	 * This file contains helper functions for managing the browser's media APIs.
	 */

	// Safari doesn't support ImageCapture (it's in experimental mode)...
	(function loadPolyfill() {
	  if (window.ImageCapture) {
	    return;
	  }

	  const polyfill = document.createElement('script');
	  polyfill.src = 'https://unpkg.com/browse/image-capture@0.4.0/lib/imagecapture.min.js';
	  document.head.appendChild(polyfill);
	})();

	function getSupportedMimeType(opts) {
	  const mimeTypes = opts.video
	    ? ['video/mpeg', 'video/webm']
	    : ['audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'];
	  const [mimeType] = mimeTypes.filter((t) => MediaRecorder.isTypeSupported(t));

	  if (!mimeType) {
	    throw new Error('No supported mime type found.');
	  }

	  return mimeType;
	}

	function mediaResult(blob) {
	  // yourvideo.mpeg or yourimage.jpeg or youraudio.mpeg, etc
	  blob.name = `your${blob.type.replace('/', '.')}`;

	  return blob;
	}

	/**
	 * Create a media recorder which can capture an image, a video or an audio track.
	 *
	 * @param {Object} opts
	 * @param {boolean} [opts.video]
	 * @param {boolean} [opts.audio]
	 */
	function createRecorder(opts) {
	  let recordedChunks = [];
	  let stream;
	  let mediaRecorder;

	  function ondataavailable(e) {
	    if (e.data.size > 0) {
	      recordedChunks.push(e.data);
	    } else {
	      console.error('No data', e);
	    }
	  }

	  function liveSrc() {
	    return stream;
	  }

	  function capturePhoto() {
	    const track = stream.getVideoTracks()[0];
	    const imageCapture = new ImageCapture(track);

	    return imageCapture.takePhoto().then(mediaResult);
	  }

	  function beginMediaCapture() {
	    recordedChunks = [];
	    mediaRecorder = new MediaRecorder(stream, {
	      mimeType: getSupportedMimeType(opts),
	    });

	    mediaRecorder.ondataavailable = ondataavailable;
	    mediaRecorder.start();
	  }

	  function endMediaCapture() {
	    return new Promise((resolve, reject) => {
	      mediaRecorder.onstop = () => {
	        try {
	          const blob = new Blob(recordedChunks, {
	            type: getSupportedMimeType(opts),
	          });
	          resolve(mediaResult(blob));
	        } catch (err) {
	          reject(err);
	        }
	      };

	      mediaRecorder.stop();
	    });
	  }

	  return navigator.mediaDevices.getUserMedia(opts).then((newStream) => {
	    stream = newStream;

	    return {
	      liveSrc,
	      capturePhoto,
	      beginMediaCapture,
	      endMediaCapture,
	    };
	  });
	}

	/* lib/media-picker.svelte generated by Svelte v3.0.0 */

	const file_1$2 = "lib/media-picker.svelte";

	function add_css$5() {
		var style = element("style");
		style.id = 'svelte-1fpy7gz-style';
		style.textContent = ".quikpik-media.svelte-1fpy7gz{box-sizing:border-box;flex-grow:1;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a202c;color:#fff;padding:1rem;border-radius:0.375rem}.quikpik-media-footer.svelte-1fpy7gz{position:relative;padding:1rem;width:100%}.quikpik-snap-photo.svelte-1fpy7gz{background:#fff;cursor:pointer;box-shadow:inset 0 0 0 2px;border:4px solid #fff;width:3rem;height:3rem;border-radius:100%;outline:none}.quikpik-stop-media.svelte-1fpy7gz,.quikpik-record-media.svelte-1fpy7gz{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:#f00;box-shadow:inset 0 0 0 2px;border:4px solid #fff;width:3rem;height:3rem;border-radius:100%;outline:none}.quikpik-stop-media.svelte-1fpy7gz{background:transparent}.quikpik-stop-media.svelte-1fpy7gz::before{content:'';background:#f00;height:1.5rem;width:1.5rem;border-radius:2px}.quikpik-snap-photo.svelte-1fpy7gz:focus{box-shadow:inset 0 0 0 4px}.quikpik-media-retake.svelte-1fpy7gz,.quikpik-media-accept.svelte-1fpy7gz{background:#5a67d8;color:#fff;border:0;padding:0.5rem 0.75rem;font-size:0.875rem;border-radius:0.375rem;cursor:pointer;margin:0 0.25rem;outline:none}.quikpik-media-retake.svelte-1fpy7gz{border:1px solid;background:transparent;color:inherit}.quikpik-info.svelte-1fpy7gz{color:#6b7280;display:flex;align-items:center;justify-content:center}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtcGlja2VyLnN2ZWx0ZSIsInNvdXJjZXMiOlsibWVkaWEtcGlja2VyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbiAgaW1wb3J0IExpdmVWaWQgZnJvbSAnLi9saXZlLXZpZC5zdmVsdGUnO1xuICBpbXBvcnQgRWxhcHNlZFRpbWUgZnJvbSAnLi9lbGFwc2VkLXRpbWUuc3ZlbHRlJztcbiAgaW1wb3J0IENvbmZpcm1NZWRpYSBmcm9tICcuL2NvbmZpcm0tbWVkaWEuc3ZlbHRlJztcbiAgaW1wb3J0IHsgY3JlYXRlUmVjb3JkZXIgfSBmcm9tICcuL21lZGlhLWxpYic7XG5cbiAgZXhwb3J0IGxldCBtb2RlO1xuICBleHBvcnQgbGV0IHVwbG9hZEZpbGU7XG5cbiAgLy8gaW5pdCB8IGxpdmUgfCBlcnJvciB8IHJlY29yZGluZyB8IGNvbmZpcm1cbiAgbGV0IHN0YXR1cyA9ICdpbml0JztcbiAgbGV0IGVycm9yO1xuICBsZXQgcmVjb3JkZXI7XG4gIGxldCByZWNvcmRlck1vZGU7XG4gIGxldCBmaWxlO1xuXG4gICQ6IHJlY29yZGVyT3B0cyA9IHsgdmlkZW86IG1vZGUgIT09ICd0YWtlYXVkaW8nLCBhdWRpbzogdHJ1ZSB9O1xuICAkOiByZWNvcmRlclByb21pc2UgPSBjcmVhdGVSZWNvcmRlcihyZWNvcmRlck9wdHMpXG4gICAgLnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICByZWNvcmRlciA9IHZhbHVlO1xuICAgICAgc3RhdHVzID0gJ2xpdmUnO1xuICAgICAgcmVjb3JkZXJNb2RlID0gbW9kZTtcbiAgICB9KVxuICAgIC5jYXRjaChtZWRpYUVycm9yKTtcblxuICBmdW5jdGlvbiBtZWRpYUVycm9yKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICBzdGF0dXMgPSAnZXJyb3InO1xuICAgIGVycm9yID0gJ1VuYWJsZSB0byBjb25uZWN0IHRvIHlvdXIgY2FtZXJhLic7XG4gIH1cblxuICBmdW5jdGlvbiBjYXB0dXJlSW1hZ2UoKSB7XG4gICAgcmVjb3JkZXJcbiAgICAgIC5jYXB0dXJlUGhvdG8oKVxuICAgICAgLnRoZW4oKG5ld0ZpbGUpID0+IHtcbiAgICAgICAgZmlsZSA9IG5ld0ZpbGU7XG4gICAgICAgIHN0YXR1cyA9ICdjb25maXJtJztcbiAgICAgIH0pXG4gICAgICAuY2F0Y2gobWVkaWFFcnJvcik7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydFJlY29yZGluZygpIHtcbiAgICByZWNvcmRlci5iZWdpbk1lZGlhQ2FwdHVyZSgpO1xuICAgIHN0YXR1cyA9ICdyZWNvcmRpbmcnO1xuICB9XG5cbiAgZnVuY3Rpb24gb25DYXB0dXJlKCkge1xuICAgIGlmIChtb2RlID09PSAndGFrZXBob3RvJykge1xuICAgICAgY2FwdHVyZUltYWdlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0UmVjb3JkaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcFJlY29yZGluZygpIHtcbiAgICByZWNvcmRlclxuICAgICAgLmVuZE1lZGlhQ2FwdHVyZSgpXG4gICAgICAudGhlbigobmV3RmlsZSkgPT4ge1xuICAgICAgICBmaWxlID0gbmV3RmlsZTtcbiAgICAgICAgc3RhdHVzID0gJ2NvbmZpcm0nO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChtZWRpYUVycm9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldGFrZSgpIHtcbiAgICBzdGF0dXMgPSAnbGl2ZSc7XG4gICAgZmlsZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFjY2VwdCgpIHtcbiAgICB1cGxvYWRGaWxlKGZpbGUpO1xuICB9XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInF1aWtwaWstbWVkaWFcIj5cbiAgeyNpZiBzdGF0dXMgPT09ICdlcnJvcid9XG4gICAgPHAgY2xhc3M9XCJxdWlrcGlrLWVycm9yXCI+e2Vycm9yfTwvcD5cbiAgey9pZn1cbiAgeyNpZiBzdGF0dXMgPT09ICdpbml0J31cbiAgICA8cCBjbGFzcz1cInF1aWtwaWstaW5mb1wiPldhaXRpbmcgZm9yIHlvdXIgY2FtZXJhIG9yIG1pY3JvcGhvbmUgdG8gYmUgcmVhZHkuPC9wPlxuICB7L2lmfVxuICB7I2lmIChzdGF0dXMgPT09ICdsaXZlJyB8fCBzdGF0dXMgPT09ICdyZWNvcmRpbmcnKSAmJiBtb2RlICE9PSAndGFrZWF1ZGlvJ31cbiAgICA8TGl2ZVZpZCByZWNvcmRlcj17cmVjb3JkZXJ9IC8+XG4gIHsvaWZ9XG4gIHsjaWYgKHN0YXR1cyA9PT0gJ2xpdmUnICYmIG1vZGUgPT09ICd0YWtlYXVkaW8nKX1cbiAgICA8cCBjbGFzcz1cInF1aWtwaWstaW5mb1wiPkNsaWNrIHRoZSByZWQgYnV0dG9uIHRvIGJlZ2luIHJlY29yZGluZy48L3A+XG4gIHsvaWZ9XG4gIHsjaWYgc3RhdHVzID09PSAnbGl2ZSd9XG4gICAgPGZvb3RlciBjbGFzcz1cInF1aWtwaWstbWVkaWEtZm9vdGVyXCI+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIGNsYXNzPVwicXVpa3Bpay1zbmFwLXBob3RvXCJcbiAgICAgICAgY2xhc3M6cXVpa3Bpay1yZWNvcmQtbWVkaWE9e21vZGUgIT09ICd0YWtlcGhvdG8nfVxuICAgICAgICBjbGFzczpxdWlrcGlrLXN0b3AtbWVkaWE9e3N0YXR1cyA9PT0gJ3JlY29yZGluZyd9XG4gICAgICAgIGRpc2FibGVkPXtyZWNvcmRlck1vZGUgIT09IG1vZGV9XG4gICAgICAgIG9uOmNsaWNrPXtvbkNhcHR1cmV9XG4gICAgICA+PC9idXR0b24+XG4gICAgPC9mb290ZXI+XG4gIHsvaWZ9XG4gIHsjaWYgc3RhdHVzID09PSAncmVjb3JkaW5nJ31cbiAgICA8Zm9vdGVyIGNsYXNzPVwicXVpa3Bpay1tZWRpYS1mb290ZXJcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJxdWlrcGlrLXN0b3AtbWVkaWFcIiBvbjpjbGljaz17c3RvcFJlY29yZGluZ30+PC9idXR0b24+XG4gICAgICA8RWxhcHNlZFRpbWUgLz5cbiAgICA8L2Zvb3Rlcj5cbiAgey9pZn1cbiAgeyNpZiBzdGF0dXMgPT09ICdjb25maXJtJ31cbiAgICA8Q29uZmlybU1lZGlhIGZpbGU9e2ZpbGV9IC8+XG4gICAgPGZvb3RlciBjbGFzcz1cInF1aWtwaWstbWVkaWEtZm9vdGVyXCI+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwicXVpa3Bpay1tZWRpYS1yZXRha2VcIiBvbjpjbGljaz17cmV0YWtlfT5cbiAgICAgICAgUmV0YWtlXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJxdWlrcGlrLW1lZGlhLWFjY2VwdFwiIG9uOmNsaWNrPXthY2NlcHR9PlxuICAgICAgICBBY2NlcHQgJmFtcDsgdXBsb2FkXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Zvb3Rlcj5cbiAgey9pZn1cbjwvZGl2PlxuXG48c3R5bGU+XG4gIC5xdWlrcGlrLW1lZGlhIHtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgIGZsZXgtZ3JvdzogMTtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kOiAjMWEyMDJjO1xuICAgIGNvbG9yOiAjZmZmO1xuICAgIHBhZGRpbmc6IDFyZW07XG4gICAgYm9yZGVyLXJhZGl1czogMC4zNzVyZW07XG4gIH1cblxuICAucXVpa3Bpay1tZWRpYS1mb290ZXIge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBwYWRkaW5nOiAxcmVtO1xuICAgIHdpZHRoOiAxMDAlO1xuICB9XG5cbiAgLnF1aWtwaWstc25hcC1waG90byB7XG4gICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMnB4O1xuICAgIGJvcmRlcjogNHB4IHNvbGlkICNmZmY7XG4gICAgd2lkdGg6IDNyZW07XG4gICAgaGVpZ2h0OiAzcmVtO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIC5xdWlrcGlrLXN0b3AtbWVkaWEsXG4gIC5xdWlrcGlrLXJlY29yZC1tZWRpYSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIGJhY2tncm91bmQ6ICNmMDA7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMnB4O1xuICAgIGJvcmRlcjogNHB4IHNvbGlkICNmZmY7XG4gICAgd2lkdGg6IDNyZW07XG4gICAgaGVpZ2h0OiAzcmVtO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIC5xdWlrcGlrLXN0b3AtbWVkaWEge1xuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLnF1aWtwaWstc3RvcC1tZWRpYTo6YmVmb3JlIHtcbiAgICBjb250ZW50OiAnJztcbiAgICBiYWNrZ3JvdW5kOiAjZjAwO1xuICAgIGhlaWdodDogMS41cmVtO1xuICAgIHdpZHRoOiAxLjVyZW07XG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xuICB9XG5cbiAgLnF1aWtwaWstc25hcC1waG90bzpmb2N1cyB7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgNHB4O1xuICB9XG5cbiAgLnF1aWtwaWstbWVkaWEtcmV0YWtlLFxuICAucXVpa3Bpay1tZWRpYS1hY2NlcHQge1xuICAgIGJhY2tncm91bmQ6ICM1YTY3ZDg7XG4gICAgY29sb3I6ICNmZmY7XG4gICAgYm9yZGVyOiAwO1xuICAgIHBhZGRpbmc6IDAuNXJlbSAwLjc1cmVtO1xuICAgIGZvbnQtc2l6ZTogMC44NzVyZW07XG4gICAgYm9yZGVyLXJhZGl1czogMC4zNzVyZW07XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIG1hcmdpbjogMCAwLjI1cmVtO1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICAucXVpa3Bpay1tZWRpYS1yZXRha2Uge1xuICAgIGJvcmRlcjogMXB4IHNvbGlkO1xuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgIGNvbG9yOiBpbmhlcml0O1xuICB9XG5cbiAgLnF1aWtwaWstaW5mbyB7XG4gICAgY29sb3I6ICM2YjcyODA7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICB9XG48L3N0eWxlPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1SEUsY0FBYyxlQUFDLENBQUMsQUFDZCxVQUFVLENBQUUsVUFBVSxDQUN0QixTQUFTLENBQUUsQ0FBQyxDQUNaLE9BQU8sQ0FBRSxJQUFJLENBQ2IsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsZUFBZSxDQUFFLE1BQU0sQ0FDdkIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsVUFBVSxDQUFFLE9BQU8sQ0FDbkIsS0FBSyxDQUFFLElBQUksQ0FDWCxPQUFPLENBQUUsSUFBSSxDQUNiLGFBQWEsQ0FBRSxRQUFRLEFBQ3pCLENBQUMsQUFFRCxxQkFBcUIsZUFBQyxDQUFDLEFBQ3JCLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsbUJBQW1CLGVBQUMsQ0FBQyxBQUNuQixVQUFVLENBQUUsSUFBSSxDQUNoQixNQUFNLENBQUUsT0FBTyxDQUNmLFVBQVUsQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUMzQixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsSUFBSSxDQUNuQixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxrQ0FBbUIsQ0FDbkIscUJBQXFCLGVBQUMsQ0FBQyxBQUNyQixRQUFRLENBQUUsUUFBUSxDQUNsQixPQUFPLENBQUUsV0FBVyxDQUNwQixXQUFXLENBQUUsTUFBTSxDQUNuQixlQUFlLENBQUUsTUFBTSxDQUN2QixNQUFNLENBQUUsT0FBTyxDQUNmLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLFVBQVUsQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUMzQixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsSUFBSSxDQUNuQixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxtQkFBbUIsZUFBQyxDQUFDLEFBQ25CLFVBQVUsQ0FBRSxXQUFXLEFBQ3pCLENBQUMsQUFFRCxrQ0FBbUIsUUFBUSxBQUFDLENBQUMsQUFDM0IsT0FBTyxDQUFFLEVBQUUsQ0FDWCxVQUFVLENBQUUsSUFBSSxDQUNoQixNQUFNLENBQUUsTUFBTSxDQUNkLEtBQUssQ0FBRSxNQUFNLENBQ2IsYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyxBQUVELGtDQUFtQixNQUFNLEFBQUMsQ0FBQyxBQUN6QixVQUFVLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQUFDN0IsQ0FBQyxBQUVELG9DQUFxQixDQUNyQixxQkFBcUIsZUFBQyxDQUFDLEFBQ3JCLFVBQVUsQ0FBRSxPQUFPLENBQ25CLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLENBQUMsQ0FDVCxPQUFPLENBQUUsTUFBTSxDQUFDLE9BQU8sQ0FDdkIsU0FBUyxDQUFFLFFBQVEsQ0FDbkIsYUFBYSxDQUFFLFFBQVEsQ0FDdkIsTUFBTSxDQUFFLE9BQU8sQ0FDZixNQUFNLENBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FDakIsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQscUJBQXFCLGVBQUMsQ0FBQyxBQUNyQixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FDakIsVUFBVSxDQUFFLFdBQVcsQ0FDdkIsS0FBSyxDQUFFLE9BQU8sQUFDaEIsQ0FBQyxBQUVELGFBQWEsZUFBQyxDQUFDLEFBQ2IsS0FBSyxDQUFFLE9BQU8sQ0FDZCxPQUFPLENBQUUsSUFBSSxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLGVBQWUsQ0FBRSxNQUFNLEFBQ3pCLENBQUMifQ== */";
		append(document.head, style);
	}

	// (77:2) {#if status === 'error'}
	function create_if_block_6(ctx) {
		var p, t;

		return {
			c: function create() {
				p = element("p");
				t = text(ctx.error);
				p.className = "quikpik-error";
				add_location(p, file_1$2, 77, 4, 1572);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, t);
			},

			p: function update(changed, ctx) {
				if (changed.error) {
					set_data(t, ctx.error);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (80:2) {#if status === 'init'}
	function create_if_block_5(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Waiting for your camera or microphone to be ready.";
				p.className = "quikpik-info svelte-1fpy7gz";
				add_location(p, file_1$2, 80, 4, 1647);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (83:2) {#if (status === 'live' || status === 'recording') && mode !== 'takeaudio'}
	function create_if_block_4(ctx) {
		var current;

		var livevid = new Live_vid({
			props: { recorder: ctx.recorder },
			$$inline: true
		});

		return {
			c: function create() {
				livevid.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(livevid, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var livevid_changes = {};
				if (changed.recorder) livevid_changes.recorder = ctx.recorder;
				livevid.$set(livevid_changes);
			},

			i: function intro(local) {
				if (current) return;
				livevid.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				livevid.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				livevid.$destroy(detaching);
			}
		};
	}

	// (86:2) {#if (status === 'live' && mode === 'takeaudio')}
	function create_if_block_3(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Click the red button to begin recording.";
				p.className = "quikpik-info svelte-1fpy7gz";
				add_location(p, file_1$2, 86, 4, 1912);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (89:2) {#if status === 'live'}
	function create_if_block_2(ctx) {
		var footer, button, button_disabled_value, dispose;

		return {
			c: function create() {
				footer = element("footer");
				button = element("button");
				button.className = "quikpik-snap-photo svelte-1fpy7gz";
				button.disabled = button_disabled_value = ctx.recorderMode !== ctx.mode;
				toggle_class(button, "quikpik-record-media", ctx.mode !== 'takephoto');
				toggle_class(button, "quikpik-stop-media", ctx.status === 'recording');
				add_location(button, file_1$2, 90, 6, 2063);
				footer.className = "quikpik-media-footer svelte-1fpy7gz";
				add_location(footer, file_1$2, 89, 4, 2019);
				dispose = listen(button, "click", ctx.onCapture);
			},

			m: function mount(target, anchor) {
				insert(target, footer, anchor);
				append(footer, button);
			},

			p: function update(changed, ctx) {
				if ((changed.recorderMode || changed.mode) && button_disabled_value !== (button_disabled_value = ctx.recorderMode !== ctx.mode)) {
					button.disabled = button_disabled_value;
				}

				if (changed.mode) {
					toggle_class(button, "quikpik-record-media", ctx.mode !== 'takephoto');
				}

				if (changed.status) {
					toggle_class(button, "quikpik-stop-media", ctx.status === 'recording');
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(footer);
				}

				dispose();
			}
		};
	}

	// (100:2) {#if status === 'recording'}
	function create_if_block_1(ctx) {
		var footer, button, t, current, dispose;

		var elapsedtime = new Elapsed_time({ $$inline: true });

		return {
			c: function create() {
				footer = element("footer");
				button = element("button");
				t = space();
				elapsedtime.$$.fragment.c();
				button.className = "quikpik-stop-media svelte-1fpy7gz";
				add_location(button, file_1$2, 101, 6, 2410);
				footer.className = "quikpik-media-footer svelte-1fpy7gz";
				add_location(footer, file_1$2, 100, 4, 2366);
				dispose = listen(button, "click", ctx.stopRecording);
			},

			m: function mount(target, anchor) {
				insert(target, footer, anchor);
				append(footer, button);
				append(footer, t);
				mount_component(elapsedtime, footer, null);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				elapsedtime.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				elapsedtime.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(footer);
				}

				elapsedtime.$destroy();

				dispose();
			}
		};
	}

	// (106:2) {#if status === 'confirm'}
	function create_if_block$1(ctx) {
		var t0, footer, button0, t2, button1, current, dispose;

		var confirmmedia = new Confirm_media({
			props: { file: ctx.file },
			$$inline: true
		});

		return {
			c: function create() {
				confirmmedia.$$.fragment.c();
				t0 = space();
				footer = element("footer");
				button0 = element("button");
				button0.textContent = "Retake";
				t2 = space();
				button1 = element("button");
				button1.textContent = "Accept & upload";
				button0.className = "quikpik-media-retake svelte-1fpy7gz";
				add_location(button0, file_1$2, 108, 6, 2634);
				button1.className = "quikpik-media-accept svelte-1fpy7gz";
				add_location(button1, file_1$2, 111, 6, 2727);
				footer.className = "quikpik-media-footer svelte-1fpy7gz";
				add_location(footer, file_1$2, 107, 4, 2590);

				dispose = [
					listen(button0, "click", ctx.retake),
					listen(button1, "click", ctx.accept)
				];
			},

			m: function mount(target, anchor) {
				mount_component(confirmmedia, target, anchor);
				insert(target, t0, anchor);
				insert(target, footer, anchor);
				append(footer, button0);
				append(footer, t2);
				append(footer, button1);
				current = true;
			},

			p: function update(changed, ctx) {
				var confirmmedia_changes = {};
				if (changed.file) confirmmedia_changes.file = ctx.file;
				confirmmedia.$set(confirmmedia_changes);
			},

			i: function intro(local) {
				if (current) return;
				confirmmedia.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				confirmmedia.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				confirmmedia.$destroy(detaching);

				if (detaching) {
					detach(t0);
					detach(footer);
				}

				run_all(dispose);
			}
		};
	}

	function create_fragment$5(ctx) {
		var div, t0, t1, t2, t3, t4, t5, current;

		var if_block0 = (ctx.status === 'error') && create_if_block_6(ctx);

		var if_block1 = (ctx.status === 'init') && create_if_block_5();

		var if_block2 = ((ctx.status === 'live' || ctx.status === 'recording') && ctx.mode !== 'takeaudio') && create_if_block_4(ctx);

		var if_block3 = ((ctx.status === 'live' && ctx.mode === 'takeaudio')) && create_if_block_3();

		var if_block4 = (ctx.status === 'live') && create_if_block_2(ctx);

		var if_block5 = (ctx.status === 'recording') && create_if_block_1(ctx);

		var if_block6 = (ctx.status === 'confirm') && create_if_block$1(ctx);

		return {
			c: function create() {
				div = element("div");
				if (if_block0) if_block0.c();
				t0 = space();
				if (if_block1) if_block1.c();
				t1 = space();
				if (if_block2) if_block2.c();
				t2 = space();
				if (if_block3) if_block3.c();
				t3 = space();
				if (if_block4) if_block4.c();
				t4 = space();
				if (if_block5) if_block5.c();
				t5 = space();
				if (if_block6) if_block6.c();
				div.className = "quikpik-media svelte-1fpy7gz";
				add_location(div, file_1$2, 75, 0, 1513);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if (if_block0) if_block0.m(div, null);
				append(div, t0);
				if (if_block1) if_block1.m(div, null);
				append(div, t1);
				if (if_block2) if_block2.m(div, null);
				append(div, t2);
				if (if_block3) if_block3.m(div, null);
				append(div, t3);
				if (if_block4) if_block4.m(div, null);
				append(div, t4);
				if (if_block5) if_block5.m(div, null);
				append(div, t5);
				if (if_block6) if_block6.m(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.status === 'error') {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_6(ctx);
						if_block0.c();
						if_block0.m(div, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.status === 'init') {
					if (!if_block1) {
						if_block1 = create_if_block_5();
						if_block1.c();
						if_block1.m(div, t1);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if ((ctx.status === 'live' || ctx.status === 'recording') && ctx.mode !== 'takeaudio') {
					if (if_block2) {
						if_block2.p(changed, ctx);
						if_block2.i(1);
					} else {
						if_block2 = create_if_block_4(ctx);
						if_block2.c();
						if_block2.i(1);
						if_block2.m(div, t2);
					}
				} else if (if_block2) {
					group_outros();
					on_outro(() => {
						if_block2.d(1);
						if_block2 = null;
					});

					if_block2.o(1);
					check_outros();
				}

				if ((ctx.status === 'live' && ctx.mode === 'takeaudio')) {
					if (!if_block3) {
						if_block3 = create_if_block_3();
						if_block3.c();
						if_block3.m(div, t3);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (ctx.status === 'live') {
					if (if_block4) {
						if_block4.p(changed, ctx);
					} else {
						if_block4 = create_if_block_2(ctx);
						if_block4.c();
						if_block4.m(div, t4);
					}
				} else if (if_block4) {
					if_block4.d(1);
					if_block4 = null;
				}

				if (ctx.status === 'recording') {
					if (if_block5) {
						if_block5.p(changed, ctx);
						if_block5.i(1);
					} else {
						if_block5 = create_if_block_1(ctx);
						if_block5.c();
						if_block5.i(1);
						if_block5.m(div, t5);
					}
				} else if (if_block5) {
					group_outros();
					on_outro(() => {
						if_block5.d(1);
						if_block5 = null;
					});

					if_block5.o(1);
					check_outros();
				}

				if (ctx.status === 'confirm') {
					if (if_block6) {
						if_block6.p(changed, ctx);
						if_block6.i(1);
					} else {
						if_block6 = create_if_block$1(ctx);
						if_block6.c();
						if_block6.i(1);
						if_block6.m(div, null);
					}
				} else if (if_block6) {
					group_outros();
					on_outro(() => {
						if_block6.d(1);
						if_block6 = null;
					});

					if_block6.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block2) if_block2.i();
				if (if_block5) if_block5.i();
				if (if_block6) if_block6.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block2) if_block2.o();
				if (if_block5) if_block5.o();
				if (if_block6) if_block6.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				if (if_block4) if_block4.d();
				if (if_block5) if_block5.d();
				if (if_block6) if_block6.d();
			}
		};
	}

	function instance$5($$self, $$props, $$invalidate) {
		

	  let { mode, uploadFile } = $$props;

	  // init | live | error | recording | confirm
	  let status = 'init';
	  let error;
	  let recorder;
	  let recorderMode;
	  let file;

	  function mediaError(err) {
	    console.error(err);
	    $$invalidate('status', status = 'error');
	    $$invalidate('error', error = 'Unable to connect to your camera.');
	  }

	  function captureImage() {
	    recorder
	      .capturePhoto()
	      .then((newFile) => {
	        $$invalidate('file', file = newFile);
	        $$invalidate('status', status = 'confirm');
	      })
	      .catch(mediaError);
	  }

	  function startRecording() {
	    recorder.beginMediaCapture();
	    $$invalidate('status', status = 'recording');
	  }

	  function onCapture() {
	    if (mode === 'takephoto') {
	      captureImage();
	    } else {
	      startRecording();
	    }
	  }

	  function stopRecording() {
	    recorder
	      .endMediaCapture()
	      .then((newFile) => {
	        $$invalidate('file', file = newFile);
	        $$invalidate('status', status = 'confirm');
	      })
	      .catch(mediaError);
	  }

	  function retake() {
	    $$invalidate('status', status = 'live');
	    $$invalidate('file', file = undefined);
	  }

	  function accept() {
	    uploadFile(file);
	  }

		$$self.$set = $$props => {
			if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
			if ('uploadFile' in $$props) $$invalidate('uploadFile', uploadFile = $$props.uploadFile);
		};

		let recorderOpts, recorderPromise;
		$$self.$$.update = ($$dirty = { mode: 1, recorderOpts: 1 }) => {
			if ($$dirty.mode) { $$invalidate('recorderOpts', recorderOpts = { video: mode !== 'takeaudio', audio: true }); }
			if ($$dirty.recorderOpts || $$dirty.mode) { $$invalidate('recorderPromise', recorderPromise = createRecorder(recorderOpts)
	        .then((value) => {
	          $$invalidate('recorder', recorder = value);
	          $$invalidate('status', status = 'live');
	          $$invalidate('recorderMode', recorderMode = mode);
	        })
	        .catch(mediaError)); }
		};

		return {
			mode,
			uploadFile,
			status,
			error,
			recorder,
			recorderMode,
			file,
			onCapture,
			stopRecording,
			retake,
			accept
		};
	}

	class Media_picker extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1fpy7gz-style")) add_css$5();
			init(this, options, instance$5, create_fragment$5, safe_not_equal, ["mode", "uploadFile"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.mode === undefined && !('mode' in props)) {
				console.warn("<Media_picker> was created without expected prop 'mode'");
			}
			if (ctx.uploadFile === undefined && !('uploadFile' in props)) {
				console.warn("<Media_picker> was created without expected prop 'uploadFile'");
			}
		}

		get mode() {
			throw new Error("<Media_picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set mode(value) {
			throw new Error("<Media_picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get uploadFile() {
			throw new Error("<Media_picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set uploadFile(value) {
			throw new Error("<Media_picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* lib/quikpik-nav.svelte generated by Svelte v3.0.0 */

	const file$3 = "lib/quikpik-nav.svelte";

	function add_css$6() {
		var style = element("style");
		style.id = 'svelte-10wcfde-style';
		style.textContent = ".quikpik-nav.svelte-10wcfde{color:#6b7280;margin-right:1.5rem;padding-right:1.5rem;border-right:1px dashed #ddd;display:flex;flex-direction:column;white-space:nowrap;align-items:flex-start}.quikpik-opt.svelte-10wcfde{background:transparent;cursor:pointer;border:0;font:inherit;font-size:0.875rem;display:inline-flex;color:inherit;align-items:center;margin-bottom:0.75rem;border-left:2px solid transparent;padding-left:0.5rem;margin-left:-0.5rem;text-decoration:none;outline:none;border-radius:0}.quikpik-opt.svelte-10wcfde:hover{color:#5a67d8}.quikpik-opt-current.svelte-10wcfde{color:#5a67d8;border-color:#5a67d8}.quikpik-opt-ico.svelte-10wcfde{margin-right:0.75rem;height:1.25rem}.quikpik-nav-mobile-toggle.svelte-10wcfde{display:none}@keyframes svelte-10wcfde-quikpik-menu-in{0%{transform:translateX(100%)}100%{transform:translateX(0)}}@media only screen and (max-width: 600px){.quikpik-nav.svelte-10wcfde{position:absolute;top:0;left:0;bottom:0;right:0;background:#fff;box-shadow:0.5rem 0 1rem -0.5rem rgba(0, 0, 0, 0.5);border:0;padding:2rem;z-index:1;display:flex;margin:0;transform:translateX(100%);z-index:-1;visibility:hidden}.quikpik-nav-flyout.svelte-10wcfde{transform:translateY(0);animation:svelte-10wcfde-quikpik-menu-in 0.1s ease forwards;z-index:9;visibility:visible}.quikpik-nav-mobile-toggle.svelte-10wcfde{display:inline-block;background:transparent;border:none;outline:none;font-size:1rem;position:absolute;right:0.5rem;top:0.5rem;z-index:10;color:#718096}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpa3Bpay1uYXYuc3ZlbHRlIiwic291cmNlcyI6WyJxdWlrcGlrLW5hdi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgLy8gU2V0IHRoZSBtb2RlXG4gIGV4cG9ydCBsZXQgc2V0TW9kZTtcblxuICAvLyBbcGlja2ZpbGUsIHRha2VwaG90bywgdGFrZXZpZGVvLCB0YWtlYXVkaW9dXG4gIGV4cG9ydCBsZXQgc291cmNlcztcblxuICAvLyBwaWNrZmlsZSB8IHRha2VwaG90byB8IHRha2V2aWRlbyB8IHRha2VhdWRpb1xuICBleHBvcnQgbGV0IG1vZGU7XG5cbiAgbGV0IGlzVmlzaWJsZSA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHRvZ2dsZUlzVmlzaWJsZSgpIHtcbiAgICBpc1Zpc2libGUgPSAhaXNWaXNpYmxlO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICBpc1Zpc2libGUgPSBmYWxzZTtcbiAgfVxuPC9zY3JpcHQ+XG5cbnsjaWYgc291cmNlcy5sZW5ndGggPiAxfVxuICA8YnV0dG9uIGNsYXNzPVwicXVpa3Bpay1uYXYtbW9iaWxlLXRvZ2dsZVwiIHR5cGU9XCJidXR0b25cIiBvbjpjbGljaz17dG9nZ2xlSXNWaXNpYmxlfT5cbiAgICDimLBcbiAgPC9idXR0b24+XG4gIDxuYXZcbiAgICBjbGFzcz1cInF1aWtwaWstbmF2XCJcbiAgICBjbGFzczpxdWlrcGlrLW5hdi1mbHlvdXQ9e2lzVmlzaWJsZX1cbiAgICBvbjpjbGljaz17aGlkZX1cbiAgPlxuICAgIHsjaWYgc291cmNlcy5pbmNsdWRlcygnZmlsZXBpY2tlcicpfVxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJxdWlrcGlrLW9wdFwiXG4gICAgICAgIGNsYXNzOnF1aWtwaWstb3B0LWN1cnJlbnQ9e21vZGUgPT09ICdwaWNrZmlsZSd9XG4gICAgICAgIG9uOmNsaWNrPXsoKSA9PiBzZXRNb2RlKCdwaWNrZmlsZScpfVxuICAgICAgPlxuICAgICAgICA8c3ZnXG4gICAgICAgICAgY2xhc3M9XCJxdWlrcGlrLW9wdC1pY29cIlxuICAgICAgICAgIGZpbGw9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgIHdpZHRoPVwiMjRcIlxuICAgICAgICAgIGhlaWdodD1cIjI0XCJcbiAgICAgICAgICB2aWV3Qm94PVwiMCAwIDI0IDI0XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxwYXRoIGQ9XCJNMjAgMTguNWMwIC4yNzYtLjIyNC41LS41LjVzLS41LS4yMjQtLjUtLjUuMjI0LS41LjUtLjUuNS4yMjQuNS41em00LTIuNWwtNS0xNGgtMTRsLTUgMTR2NmgyNHYtNnptLTE3LjY2Ni0xMmgxMS4zMzNsMy43NSAxMWgtMTguODM0bDMuNzUxLTExem0xNS42NjYgMTZoLTIwdi0zaDIwdjN6bS05LTZ2LTVoM2wtNC00LTQgNGgzdjVoMnpcIiAvPlxuICAgICAgICA8L3N2Zz5cbiAgICAgICAgRmlsZSBwaWNrZXJcbiAgICAgIDwvYnV0dG9uPlxuICAgIHsvaWZ9XG4gICAgeyNpZiBzb3VyY2VzLmluY2x1ZGVzKCd0YWtlcGhvdG8nKX1cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwicXVpa3Bpay1vcHRcIlxuICAgICAgICBjbGFzczpxdWlrcGlrLW9wdC1jdXJyZW50PXttb2RlID09PSAndGFrZXBob3RvJ31cbiAgICAgICAgb246Y2xpY2s9eygpID0+IHNldE1vZGUoJ3Rha2VwaG90bycpfVxuICAgICAgPlxuICAgICAgICA8c3ZnXG4gICAgICAgICAgY2xhc3M9XCJxdWlrcGlrLW9wdC1pY29cIlxuICAgICAgICAgIGZpbGw9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgIHdpZHRoPVwiMjRcIlxuICAgICAgICAgIGhlaWdodD1cIjI0XCJcbiAgICAgICAgICB2aWV3Qm94PVwiMCAwIDI0IDI0XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxwYXRoIGQ9XCJNNSA0aC0zdi0xaDN2MXptMTAuOTMgMGwuODEyIDEuMjE5Yy43NDMgMS4xMTUgMS45ODcgMS43ODEgMy4zMjggMS43ODFoMS45M3YxM2gtMjB2LTEzaDMuOTNjMS4zNDEgMCAyLjU4NS0uNjY2IDMuMzI4LTEuNzgxbC44MTItMS4yMTloNS44NnptMS4wNy0yaC04bC0xLjQwNiAyLjEwOWMtLjM3MS41NTctLjk5NS44OTEtMS42NjQuODkxaC01LjkzdjE3aDI0di0xN2gtMy45M2MtLjY2OSAwLTEuMjkzLS4zMzQtMS42NjQtLjg5MWwtMS40MDYtMi4xMDl6bS0xMSA4YzAtLjU1Mi0uNDQ3LTEtMS0xcy0xIC40NDgtMSAxIC40NDcgMSAxIDEgMS0uNDQ4IDEtMXptNyAwYzEuNjU0IDAgMyAxLjM0NiAzIDNzLTEuMzQ2IDMtMyAzLTMtMS4zNDYtMy0zIDEuMzQ2LTMgMy0zem0wLTJjLTIuNzYxIDAtNSAyLjIzOS01IDVzMi4yMzkgNSA1IDUgNS0yLjIzOSA1LTUtMi4yMzktNS01LTV6XCIgLz5cbiAgICAgICAgPC9zdmc+XG4gICAgICAgIFRha2UgcGljdHVyZVxuICAgICAgPC9idXR0b24+XG4gICAgey9pZn1cbiAgICB7I2lmIHNvdXJjZXMuaW5jbHVkZXMoJ3Rha2V2aWRlbycpfVxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJxdWlrcGlrLW9wdFwiXG4gICAgICAgIGNsYXNzOnF1aWtwaWstb3B0LWN1cnJlbnQ9e21vZGUgPT09ICd0YWtldmlkZW8nfVxuICAgICAgICBvbjpjbGljaz17KCkgPT4gc2V0TW9kZSgndGFrZXZpZGVvJyl9XG4gICAgICA+XG4gICAgICAgIDxzdmdcbiAgICAgICAgICBjbGFzcz1cInF1aWtwaWstb3B0LWljb1wiXG4gICAgICAgICAgZmlsbD1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgd2lkdGg9XCIyNFwiXG4gICAgICAgICAgaGVpZ2h0PVwiMjRcIlxuICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjQgMjRcIlxuICAgICAgICA+XG4gICAgICAgICAgPHBhdGggZD1cIk0yLjE4NCA3Ljg3NGwtMi4xODQtLjkxOCAyLjk2Ny0yLjk1Ni45MzMgMi4xNjQtMS43MTYgMS43MXptMjEuODE2IDIuMTI2bC0zIDJ2NGwzIDJ2LTh6bS03LTJoLTcuMDE4bC43OS43ODdjLjM1Ni4zNTUuNjI5Ljc2OS44MzEgMS4yMTNoNC44OTdjLjI3NiAwIC41LjIyNC41LjV2N2MwIC4yNzYtLjIyNC41LS41LjVoLTExYy0uMjc2IDAtLjUtLjIyNC0uNS0uNXYtMi45MDlsLS4wMTgtLjAxNC0xLjk4Mi0xLjk3NXY1LjM5OGMwIDEuMTA0Ljg5NiAyIDIgMmgxMmMxLjEwNCAwIDItLjg5NiAyLTJ2LThjMC0xLjEwNC0uODk2LTItMi0yem0tMTQuNjUgMS4xM2wyLjk2Ny0yLjk1NiA0LjA0NCA0LjAyOWMuODE5LjgxNi44MTkgMi4xNCAwIDIuOTU2LS44MTkuODE2LTIuMTQ3LjgxNS0yLjk2NyAwbC00LjA0NC00LjAyOXpcIiAvPlxuICAgICAgICA8L3N2Zz5cbiAgICAgICAgQ2FwdHVyZSB2aWRlb1xuICAgICAgPC9idXR0b24+XG4gICAgey9pZn1cbiAgICB7I2lmIHNvdXJjZXMuaW5jbHVkZXMoJ3Rha2VhdWRpbycpfVxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJxdWlrcGlrLW9wdFwiXG4gICAgICAgIGNsYXNzOnF1aWtwaWstb3B0LWN1cnJlbnQ9e21vZGUgPT09ICd0YWtlYXVkaW8nfVxuICAgICAgICBvbjpjbGljaz17KCkgPT4gc2V0TW9kZSgndGFrZWF1ZGlvJyl9XG4gICAgICA+XG4gICAgICAgIDxzdmdcbiAgICAgICAgICBjbGFzcz1cInF1aWtwaWstb3B0LWljb1wiXG4gICAgICAgICAgZmlsbD1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgd2lkdGg9XCIyNFwiXG4gICAgICAgICAgaGVpZ2h0PVwiMjRcIlxuICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjQgMjRcIlxuICAgICAgICA+XG4gICAgICAgICAgPHBhdGggZD1cIk0xMiAyYzEuMTAzIDAgMiAuODk3IDIgMnY3YzAgMS4xMDMtLjg5NyAyLTIgMnMtMi0uODk3LTItMnYtN2MwLTEuMTAzLjg5Ny0yIDItMnptMC0yYy0yLjIwOSAwLTQgMS43OTEtNCA0djdjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHYtN2MwLTIuMjA5LTEuNzkxLTQtNC00em04IDl2MmMwIDQuNDE4LTMuNTgyIDgtOCA4cy04LTMuNTgyLTgtOHYtMmgydjJjMCAzLjMwOSAyLjY5MSA2IDYgNnM2LTIuNjkxIDYtNnYtMmgyem0tNyAxM3YtMmgtMnYyaC00djJoMTB2LTJoLTR6XCIgLz5cbiAgICAgICAgPC9zdmc+XG4gICAgICAgIFJlY29yZCBhdWRpb1xuICAgICAgPC9idXR0b24+XG4gICAgey9pZn1cbiAgPC9uYXY+XG57L2lmfVxuXG48c3R5bGU+XG4gIC5xdWlrcGlrLW5hdiB7XG4gICAgY29sb3I6ICM2YjcyODA7XG4gICAgbWFyZ2luLXJpZ2h0OiAxLjVyZW07XG4gICAgcGFkZGluZy1yaWdodDogMS41cmVtO1xuICAgIGJvcmRlci1yaWdodDogMXB4IGRhc2hlZCAjZGRkO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICB9XG5cbiAgLnF1aWtwaWstb3B0IHtcbiAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgYm9yZGVyOiAwO1xuICAgIGZvbnQ6IGluaGVyaXQ7XG4gICAgZm9udC1zaXplOiAwLjg3NXJlbTtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBjb2xvcjogaW5oZXJpdDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIG1hcmdpbi1ib3R0b206IDAuNzVyZW07XG4gICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCB0cmFuc3BhcmVudDtcbiAgICBwYWRkaW5nLWxlZnQ6IDAuNXJlbTtcbiAgICBtYXJnaW4tbGVmdDogLTAuNXJlbTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgICBib3JkZXItcmFkaXVzOiAwO1xuICB9XG5cbiAgLnF1aWtwaWstb3B0OmhvdmVyIHtcbiAgICBjb2xvcjogIzVhNjdkODtcbiAgfVxuXG4gIC5xdWlrcGlrLW9wdC1jdXJyZW50IHtcbiAgICBjb2xvcjogIzVhNjdkODtcbiAgICBib3JkZXItY29sb3I6ICM1YTY3ZDg7XG4gIH1cblxuICAucXVpa3Bpay1vcHQtaWNvIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDAuNzVyZW07XG4gICAgaGVpZ2h0OiAxLjI1cmVtO1xuICB9XG5cbiAgLnF1aWtwaWstbmF2LW1vYmlsZS10b2dnbGUge1xuICAgIGRpc3BsYXk6IG5vbmU7XG4gIH1cblxuICBAa2V5ZnJhbWVzIHF1aWtwaWstbWVudS1pbiB7XG4gICAgMCUge1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMCUpO1xuICAgIH1cbiAgICAxMDAlIHtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTtcbiAgICB9XG4gIH1cblxuICBAbWVkaWEgb25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDYwMHB4KSB7XG4gICAgLnF1aWtwaWstbmF2IHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHRvcDogMDtcbiAgICAgIGxlZnQ6IDA7XG4gICAgICBib3R0b206IDA7XG4gICAgICByaWdodDogMDtcbiAgICAgIGJhY2tncm91bmQ6ICNmZmY7XG4gICAgICBib3gtc2hhZG93OiAwLjVyZW0gMCAxcmVtIC0wLjVyZW0gcmdiYSgwLCAwLCAwLCAwLjUpO1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgIHotaW5kZXg6IDE7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMCUpO1xuICAgICAgei1pbmRleDogLTE7XG4gICAgICB2aXNpYmlsaXR5OiBoaWRkZW47XG4gICAgfVxuXG4gICAgLnF1aWtwaWstbmF2LWZseW91dCB7XG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7XG4gICAgICBhbmltYXRpb246IHF1aWtwaWstbWVudS1pbiAwLjFzIGVhc2UgZm9yd2FyZHM7XG4gICAgICB6LWluZGV4OiA5O1xuICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcbiAgICB9XG5cbiAgICAucXVpa3Bpay1uYXYtbW9iaWxlLXRvZ2dsZSB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBmb250LXNpemU6IDFyZW07XG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICByaWdodDogMC41cmVtO1xuICAgICAgdG9wOiAwLjVyZW07XG4gICAgICB6LWluZGV4OiAxMDtcbiAgICAgIGNvbG9yOiAjNzE4MDk2O1xuICAgIH1cbiAgfVxuPC9zdHlsZT4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBOEdFLFlBQVksZUFBQyxDQUFDLEFBQ1osS0FBSyxDQUFFLE9BQU8sQ0FDZCxZQUFZLENBQUUsTUFBTSxDQUNwQixhQUFhLENBQUUsTUFBTSxDQUNyQixZQUFZLENBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQzdCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsV0FBVyxDQUFFLFVBQVUsQUFDekIsQ0FBQyxBQUVELFlBQVksZUFBQyxDQUFDLEFBQ1osVUFBVSxDQUFFLFdBQVcsQ0FDdkIsTUFBTSxDQUFFLE9BQU8sQ0FDZixNQUFNLENBQUUsQ0FBQyxDQUNULElBQUksQ0FBRSxPQUFPLENBQ2IsU0FBUyxDQUFFLFFBQVEsQ0FDbkIsT0FBTyxDQUFFLFdBQVcsQ0FDcEIsS0FBSyxDQUFFLE9BQU8sQ0FDZCxXQUFXLENBQUUsTUFBTSxDQUNuQixhQUFhLENBQUUsT0FBTyxDQUN0QixXQUFXLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ2xDLFlBQVksQ0FBRSxNQUFNLENBQ3BCLFdBQVcsQ0FBRSxPQUFPLENBQ3BCLGVBQWUsQ0FBRSxJQUFJLENBQ3JCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsYUFBYSxDQUFFLENBQUMsQUFDbEIsQ0FBQyxBQUVELDJCQUFZLE1BQU0sQUFBQyxDQUFDLEFBQ2xCLEtBQUssQ0FBRSxPQUFPLEFBQ2hCLENBQUMsQUFFRCxvQkFBb0IsZUFBQyxDQUFDLEFBQ3BCLEtBQUssQ0FBRSxPQUFPLENBQ2QsWUFBWSxDQUFFLE9BQU8sQUFDdkIsQ0FBQyxBQUVELGdCQUFnQixlQUFDLENBQUMsQUFDaEIsWUFBWSxDQUFFLE9BQU8sQ0FDckIsTUFBTSxDQUFFLE9BQU8sQUFDakIsQ0FBQyxBQUVELDBCQUEwQixlQUFDLENBQUMsQUFDMUIsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsV0FBVyw4QkFBZ0IsQ0FBQyxBQUMxQixFQUFFLEFBQUMsQ0FBQyxBQUNGLFNBQVMsQ0FBRSxXQUFXLElBQUksQ0FBQyxBQUM3QixDQUFDLEFBQ0QsSUFBSSxBQUFDLENBQUMsQUFDSixTQUFTLENBQUUsV0FBVyxDQUFDLENBQUMsQUFDMUIsQ0FBQyxBQUNILENBQUMsQUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUN6QyxZQUFZLGVBQUMsQ0FBQyxBQUNaLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxDQUFDLENBQ04sSUFBSSxDQUFFLENBQUMsQ0FDUCxNQUFNLENBQUUsQ0FBQyxDQUNULEtBQUssQ0FBRSxDQUFDLENBQ1IsVUFBVSxDQUFFLElBQUksQ0FDaEIsVUFBVSxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUNwRCxNQUFNLENBQUUsQ0FBQyxDQUNULE9BQU8sQ0FBRSxJQUFJLENBQ2IsT0FBTyxDQUFFLENBQUMsQ0FDVixPQUFPLENBQUUsSUFBSSxDQUNiLE1BQU0sQ0FBRSxDQUFDLENBQ1QsU0FBUyxDQUFFLFdBQVcsSUFBSSxDQUFDLENBQzNCLE9BQU8sQ0FBRSxFQUFFLENBQ1gsVUFBVSxDQUFFLE1BQU0sQUFDcEIsQ0FBQyxBQUVELG1CQUFtQixlQUFDLENBQUMsQUFDbkIsU0FBUyxDQUFFLFdBQVcsQ0FBQyxDQUFDLENBQ3hCLFNBQVMsQ0FBRSw4QkFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUM3QyxPQUFPLENBQUUsQ0FBQyxDQUNWLFVBQVUsQ0FBRSxPQUFPLEFBQ3JCLENBQUMsQUFFRCwwQkFBMEIsZUFBQyxDQUFDLEFBQzFCLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLFVBQVUsQ0FBRSxXQUFXLENBQ3ZCLE1BQU0sQ0FBRSxJQUFJLENBQ1osT0FBTyxDQUFFLElBQUksQ0FDYixTQUFTLENBQUUsSUFBSSxDQUNmLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEtBQUssQ0FBRSxNQUFNLENBQ2IsR0FBRyxDQUFFLE1BQU0sQ0FDWCxPQUFPLENBQUUsRUFBRSxDQUNYLEtBQUssQ0FBRSxPQUFPLEFBQ2hCLENBQUMsQUFDSCxDQUFDIn0= */";
		append(document.head, style);
	}

	// (22:0) {#if sources.length > 1}
	function create_if_block$2(ctx) {
		var button, t1, nav, t2, t3, t4, dispose;

		var if_block0 = (ctx.sources.includes('filepicker')) && create_if_block_4$1(ctx);

		var if_block1 = (ctx.sources.includes('takephoto')) && create_if_block_3$1(ctx);

		var if_block2 = (ctx.sources.includes('takevideo')) && create_if_block_2$1(ctx);

		var if_block3 = (ctx.sources.includes('takeaudio')) && create_if_block_1$1(ctx);

		return {
			c: function create() {
				button = element("button");
				button.textContent = "☰";
				t1 = space();
				nav = element("nav");
				if (if_block0) if_block0.c();
				t2 = space();
				if (if_block1) if_block1.c();
				t3 = space();
				if (if_block2) if_block2.c();
				t4 = space();
				if (if_block3) if_block3.c();
				button.className = "quikpik-nav-mobile-toggle svelte-10wcfde";
				button.type = "button";
				add_location(button, file$3, 22, 2, 367);
				nav.className = "quikpik-nav svelte-10wcfde";
				toggle_class(nav, "quikpik-nav-flyout", ctx.isVisible);
				add_location(nav, file$3, 25, 2, 471);

				dispose = [
					listen(button, "click", ctx.toggleIsVisible),
					listen(nav, "click", ctx.hide)
				];
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				insert(target, t1, anchor);
				insert(target, nav, anchor);
				if (if_block0) if_block0.m(nav, null);
				append(nav, t2);
				if (if_block1) if_block1.m(nav, null);
				append(nav, t3);
				if (if_block2) if_block2.m(nav, null);
				append(nav, t4);
				if (if_block3) if_block3.m(nav, null);
			},

			p: function update(changed, ctx) {
				if (ctx.sources.includes('filepicker')) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_4$1(ctx);
						if_block0.c();
						if_block0.m(nav, t2);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.sources.includes('takephoto')) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_3$1(ctx);
						if_block1.c();
						if_block1.m(nav, t3);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.sources.includes('takevideo')) {
					if (if_block2) {
						if_block2.p(changed, ctx);
					} else {
						if_block2 = create_if_block_2$1(ctx);
						if_block2.c();
						if_block2.m(nav, t4);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (ctx.sources.includes('takeaudio')) {
					if (if_block3) {
						if_block3.p(changed, ctx);
					} else {
						if_block3 = create_if_block_1$1(ctx);
						if_block3.c();
						if_block3.m(nav, null);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (changed.isVisible) {
					toggle_class(nav, "quikpik-nav-flyout", ctx.isVisible);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
					detach(t1);
					detach(nav);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				run_all(dispose);
			}
		};
	}

	// (31:4) {#if sources.includes('filepicker')}
	function create_if_block_4$1(ctx) {
		var button, svg, path, t, dispose;

		return {
			c: function create() {
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t = text("\n        File picker");
				attr(path, "d", "M20 18.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5.224-.5.5-.5.5.224.5.5zm4-2.5l-5-14h-14l-5 14v6h24v-6zm-17.666-12h11.333l3.75 11h-18.834l3.751-11zm15.666 16h-20v-3h20v3zm-9-6v-5h3l-4-4-4 4h3v5h2z");
				add_location(path, file$3, 44, 10, 949);
				attr(svg, "class", "quikpik-opt-ico svelte-10wcfde");
				attr(svg, "fill", "currentColor");
				attr(svg, "width", "24");
				attr(svg, "height", "24");
				attr(svg, "viewBox", "0 0 24 24");
				add_location(svg, file$3, 37, 8, 787);
				button.type = "button";
				button.className = "quikpik-opt svelte-10wcfde";
				toggle_class(button, "quikpik-opt-current", ctx.mode === 'pickfile');
				add_location(button, file$3, 31, 6, 612);
				dispose = listen(button, "click", ctx.click_handler);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, svg);
				append(svg, path);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if (changed.mode) {
					toggle_class(button, "quikpik-opt-current", ctx.mode === 'pickfile');
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (50:4) {#if sources.includes('takephoto')}
	function create_if_block_3$1(ctx) {
		var button, svg, path, t, dispose;

		return {
			c: function create() {
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t = text("\n        Take picture");
				attr(path, "d", "M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z");
				add_location(path, file$3, 63, 10, 1598);
				attr(svg, "class", "quikpik-opt-ico svelte-10wcfde");
				attr(svg, "fill", "currentColor");
				attr(svg, "width", "24");
				attr(svg, "height", "24");
				attr(svg, "viewBox", "0 0 24 24");
				add_location(svg, file$3, 56, 8, 1436);
				button.type = "button";
				button.className = "quikpik-opt svelte-10wcfde";
				toggle_class(button, "quikpik-opt-current", ctx.mode === 'takephoto');
				add_location(button, file$3, 50, 6, 1259);
				dispose = listen(button, "click", ctx.click_handler_1);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, svg);
				append(svg, path);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if (changed.mode) {
					toggle_class(button, "quikpik-opt-current", ctx.mode === 'takephoto');
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (69:4) {#if sources.includes('takevideo')}
	function create_if_block_2$1(ctx) {
		var button, svg, path, t, dispose;

		return {
			c: function create() {
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t = text("\n        Capture video");
				attr(path, "d", "M2.184 7.874l-2.184-.918 2.967-2.956.933 2.164-1.716 1.71zm21.816 2.126l-3 2v4l3 2v-8zm-7-2h-7.018l.79.787c.356.355.629.769.831 1.213h4.897c.276 0 .5.224.5.5v7c0 .276-.224.5-.5.5h-11c-.276 0-.5-.224-.5-.5v-2.909l-.018-.014-1.982-1.975v5.398c0 1.104.896 2 2 2h12c1.104 0 2-.896 2-2v-8c0-1.104-.896-2-2-2zm-14.65 1.13l2.967-2.956 4.044 4.029c.819.816.819 2.14 0 2.956-.819.816-2.147.815-2.967 0l-4.044-4.029z");
				add_location(path, file$3, 82, 10, 2498);
				attr(svg, "class", "quikpik-opt-ico svelte-10wcfde");
				attr(svg, "fill", "currentColor");
				attr(svg, "width", "24");
				attr(svg, "height", "24");
				attr(svg, "viewBox", "0 0 24 24");
				add_location(svg, file$3, 75, 8, 2336);
				button.type = "button";
				button.className = "quikpik-opt svelte-10wcfde";
				toggle_class(button, "quikpik-opt-current", ctx.mode === 'takevideo');
				add_location(button, file$3, 69, 6, 2159);
				dispose = listen(button, "click", ctx.click_handler_2);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, svg);
				append(svg, path);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if (changed.mode) {
					toggle_class(button, "quikpik-opt-current", ctx.mode === 'takevideo');
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (88:4) {#if sources.includes('takeaudio')}
	function create_if_block_1$1(ctx) {
		var button, svg, path, t, dispose;

		return {
			c: function create() {
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t = text("\n        Record audio");
				attr(path, "d", "M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z");
				add_location(path, file$3, 101, 10, 3366);
				attr(svg, "class", "quikpik-opt-ico svelte-10wcfde");
				attr(svg, "fill", "currentColor");
				attr(svg, "width", "24");
				attr(svg, "height", "24");
				attr(svg, "viewBox", "0 0 24 24");
				add_location(svg, file$3, 94, 8, 3204);
				button.type = "button";
				button.className = "quikpik-opt svelte-10wcfde";
				toggle_class(button, "quikpik-opt-current", ctx.mode === 'takeaudio');
				add_location(button, file$3, 88, 6, 3027);
				dispose = listen(button, "click", ctx.click_handler_3);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, svg);
				append(svg, path);
				append(button, t);
			},

			p: function update(changed, ctx) {
				if (changed.mode) {
					toggle_class(button, "quikpik-opt-current", ctx.mode === 'takeaudio');
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	function create_fragment$6(ctx) {
		var if_block_anchor;

		var if_block = (ctx.sources.length > 1) && create_if_block$2(ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (ctx.sources.length > 1) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance$6($$self, $$props, $$invalidate) {
		// Set the mode
	  let { setMode, sources, mode } = $$props;

	  let isVisible = false;

	  function toggleIsVisible() {
	    $$invalidate('isVisible', isVisible = !isVisible);
	  }

	  function hide() {
	    $$invalidate('isVisible', isVisible = false);
	  }

		function click_handler() {
			return setMode('pickfile');
		}

		function click_handler_1() {
			return setMode('takephoto');
		}

		function click_handler_2() {
			return setMode('takevideo');
		}

		function click_handler_3() {
			return setMode('takeaudio');
		}

		$$self.$set = $$props => {
			if ('setMode' in $$props) $$invalidate('setMode', setMode = $$props.setMode);
			if ('sources' in $$props) $$invalidate('sources', sources = $$props.sources);
			if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
		};

		return {
			setMode,
			sources,
			mode,
			isVisible,
			toggleIsVisible,
			hide,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3
		};
	}

	class Quikpik_nav extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-10wcfde-style")) add_css$6();
			init(this, options, instance$6, create_fragment$6, safe_not_equal, ["setMode", "sources", "mode"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.setMode === undefined && !('setMode' in props)) {
				console.warn("<Quikpik_nav> was created without expected prop 'setMode'");
			}
			if (ctx.sources === undefined && !('sources' in props)) {
				console.warn("<Quikpik_nav> was created without expected prop 'sources'");
			}
			if (ctx.mode === undefined && !('mode' in props)) {
				console.warn("<Quikpik_nav> was created without expected prop 'mode'");
			}
		}

		get setMode() {
			throw new Error("<Quikpik_nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set setMode(value) {
			throw new Error("<Quikpik_nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sources() {
			throw new Error("<Quikpik_nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sources(value) {
			throw new Error("<Quikpik_nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get mode() {
			throw new Error("<Quikpik_nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set mode(value) {
			throw new Error("<Quikpik_nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* lib/quikpik.svelte generated by Svelte v3.0.0 */

	const file_1$3 = "lib/quikpik.svelte";

	function add_css$7() {
		var style = element("style");
		style.id = 'svelte-1kh5i0t-style';
		style.textContent = ".quikpik.svelte-1kh5i0t{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-family:Inter var, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,\n      Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji,\n      Segoe UI Symbol, Noto Color Emoji;z-index:10000}.quikpik.svelte-1kh5i0t::before{content:'';position:absolute;top:0;left:0;bottom:0;right:0;background:#6b7280;opacity:0.75;z-index:10000}@keyframes svelte-1kh5i0t-quikpik-up{0%{opacity:0;transform:translateY(4rem)}100%{opacity:1;transform:translateY(0)}}.quikpik-body.svelte-1kh5i0t{position:relative;background:#fff;padding:1.5rem;border-radius:0.5rem;text-align:center;font-size:0.875rem;z-index:10001;width:calc(100vw - 5rem);height:calc(100vh - 5rem);max-width:1024px;max-height:780px;box-shadow:0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);outline:none;animation:svelte-1kh5i0t-quikpik-up 0.25s ease forwards;display:flex;overflow:hidden}@media only screen and (max-width: 600px){.quikpik-body.svelte-1kh5i0t{padding:0;width:calc(100% - 2rem);height:calc(100% - 2rem)}}.quikpik-body-fit.svelte-1kh5i0t{height:auto;max-width:24rem;padding:1.5rem}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpa3Bpay5zdmVsdGUiLCJzb3VyY2VzIjpbInF1aWtwaWsuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuICBpbXBvcnQgRmlsZVBpY2tlciBmcm9tICcuL2ZpbGUtcGlja2VyLnN2ZWx0ZSc7XG4gIGltcG9ydCBVcGxvYWRQcm9ncmVzcyBmcm9tICcuL3VwbG9hZC1wcm9ncmVzcy5zdmVsdGUnO1xuICBpbXBvcnQgTWVkaWFQaWNrZXIgZnJvbSAnLi9tZWRpYS1waWNrZXIuc3ZlbHRlJztcbiAgaW1wb3J0IE5hdiBmcm9tICcuL3F1aWtwaWstbmF2LnN2ZWx0ZSc7XG5cbiAgLy8gVGhlIHVwbG9hZCBmdW5jdGlvbiwgcGFzc2VkIGludG8gcXVpa3BpayBvcHRzXG4gIGV4cG9ydCBsZXQgdXBsb2FkO1xuICBleHBvcnQgbGV0IGN1c3RvbVByb2dyZXNzID0gZmFsc2U7XG4gIGV4cG9ydCBsZXQgc291cmNlcyA9IFsnZmlsZXBpY2tlcicsICd0YWtlcGhvdG8nLCAndGFrZXZpZGVvJywgJ3Rha2VhdWRpbyddO1xuICBleHBvcnQgbGV0IGNsb3NlO1xuICBleHBvcnQgbGV0IHVwbG9hZGVyO1xuXG4gIGxldCBtb2RlID0gJ3BpY2tmaWxlJztcbiAgbGV0IGZpbGU7XG4gIGxldCBwcm9ncmVzcyA9IDA7XG5cbiAgZnVuY3Rpb24gc2V0TW9kZShuZXdNb2RlKSB7XG4gICAgbW9kZSA9IG5ld01vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBvblByb2dyZXNzKG5ld1Byb2dyZXNzKSB7XG4gICAgcHJvZ3Jlc3MgPSBuZXdQcm9ncmVzcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwbG9hZEZpbGUobmV3RmlsZSkge1xuICAgIGlmICghbmV3RmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZpbGUgPSBuZXdGaWxlO1xuICAgIHVwbG9hZGVyID0gdXBsb2FkKHsgZmlsZSwgb25Qcm9ncmVzcyB9KTtcblxuICAgIC8vIEdpdmUgdGhlIHVzZXIgYSBiaXQgb2YgdGltZSB0byBzZWUgdGhhdCB3ZSd2ZSBjb21wbGV0ZWQuXG4gICAgdXBsb2FkZXIucHJvbWlzZVxuICAgICAgLnRoZW4oKCkgPT4gc2V0VGltZW91dChjbG9zZSwgNzUwKSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIgJiYgZXJyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgIGFsZXJ0KCdVcGxvYWQgZmFpbGVkLiAnICsgKGVyci5tZXNzYWdlIHx8ICcnKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsRXZlbnQoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZU9uRXNjYXBlKGUpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnIHx8IGUuY29kZSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgIGNsb3NlKCk7XG4gICAgfVxuICB9XG48L3NjcmlwdD5cblxuPHN2ZWx0ZTpvcHRpb25zIGFjY2Vzc29ycz17dHJ1ZX0+PC9zdmVsdGU6b3B0aW9ucz5cbjxzdmVsdGU6d2luZG93IG9uOmtleWRvd249e2Nsb3NlT25Fc2NhcGV9Pjwvc3ZlbHRlOndpbmRvdz5cblxueyNpZiAhY3VzdG9tUHJvZ3Jlc3MgfHwgIXVwbG9hZGVyfVxuICA8ZGl2IGNsYXNzPVwicXVpa3Bpa1wiIG9uOmNsaWNrPXtjbG9zZX0+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJxdWlrcGlrLWJvZHlcIlxuICAgICAgY2xhc3M6cXVpa3Bpay1ib2R5LWZpdD17dXBsb2FkZXJ9XG4gICAgICBvbjpjbGljaz17Y2FuY2VsRXZlbnR9XG4gICAgPlxuICAgICAgeyNpZiB1cGxvYWRlcn1cbiAgICAgICAgPFVwbG9hZFByb2dyZXNzIHtwcm9ncmVzc30ge2ZpbGV9IC8+XG4gICAgICB7OmVsc2V9XG4gICAgICAgIDxOYXYgbW9kZT17bW9kZX0gc2V0TW9kZT17c2V0TW9kZX0gc291cmNlcz17c291cmNlc30gLz5cbiAgICAgICAgeyNpZiBtb2RlID09PSAncGlja2ZpbGUnfVxuICAgICAgICAgIDxGaWxlUGlja2VyIHVwbG9hZEZpbGU9e3VwbG9hZEZpbGV9IC8+XG4gICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICA8TWVkaWFQaWNrZXIgdXBsb2FkRmlsZT17dXBsb2FkRmlsZX0gbW9kZT17bW9kZX0gLz5cbiAgICAgICAgey9pZn1cbiAgICAgIHsvaWZ9XG4gICAgPC9kaXY+XG4gIDwvZGl2Plxuey9pZn1cblxuPHN0eWxlPlxuICAucXVpa3BpayB7XG4gICAgcG9zaXRpb246IGZpeGVkO1xuICAgIHRvcDogMDtcbiAgICBsZWZ0OiAwO1xuICAgIHJpZ2h0OiAwO1xuICAgIGJvdHRvbTogMDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgZm9udC1mYW1pbHk6IEludGVyIHZhciwgc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsIFNlZ29lIFVJLCBSb2JvdG8sXG4gICAgICBIZWx2ZXRpY2EgTmV1ZSwgQXJpYWwsIE5vdG8gU2Fucywgc2Fucy1zZXJpZiwgQXBwbGUgQ29sb3IgRW1vamksIFNlZ29lIFVJIEVtb2ppLFxuICAgICAgU2Vnb2UgVUkgU3ltYm9sLCBOb3RvIENvbG9yIEVtb2ppO1xuICAgIHotaW5kZXg6IDEwMDAwO1xuICB9XG5cbiAgLnF1aWtwaWs6OmJlZm9yZSB7XG4gICAgY29udGVudDogJyc7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHRvcDogMDtcbiAgICBsZWZ0OiAwO1xuICAgIGJvdHRvbTogMDtcbiAgICByaWdodDogMDtcbiAgICBiYWNrZ3JvdW5kOiAjNmI3MjgwO1xuICAgIG9wYWNpdHk6IDAuNzU7XG4gICAgei1pbmRleDogMTAwMDA7XG4gIH1cblxuICBAa2V5ZnJhbWVzIHF1aWtwaWstdXAge1xuICAgIDAlIHtcbiAgICAgIG9wYWNpdHk6IDA7XG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNHJlbSk7XG4gICAgfVxuICAgIDEwMCUge1xuICAgICAgb3BhY2l0eTogMTtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcbiAgICB9XG4gIH1cblxuICAucXVpa3Bpay1ib2R5IHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICBwYWRkaW5nOiAxLjVyZW07XG4gICAgYm9yZGVyLXJhZGl1czogMC41cmVtO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBmb250LXNpemU6IDAuODc1cmVtO1xuICAgIHotaW5kZXg6IDEwMDAxO1xuICAgIHdpZHRoOiBjYWxjKDEwMHZ3IC0gNXJlbSk7XG4gICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNXJlbSk7XG4gICAgbWF4LXdpZHRoOiAxMDI0cHg7XG4gICAgbWF4LWhlaWdodDogNzgwcHg7XG4gICAgYm94LXNoYWRvdzogMCAyMHB4IDI1cHggLTVweCByZ2JhKDAsIDAsIDAsIDAuMSksIDAgMTBweCAxMHB4IC01cHggcmdiYSgwLCAwLCAwLCAwLjA0KTtcbiAgICBvdXRsaW5lOiBub25lO1xuICAgIGFuaW1hdGlvbjogcXVpa3Bpay11cCAwLjI1cyBlYXNlIGZvcndhcmRzO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgfVxuXG4gIEBtZWRpYSBvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNjAwcHgpIHtcbiAgICAucXVpa3Bpay1ib2R5IHtcbiAgICAgIHBhZGRpbmc6IDA7XG4gICAgICB3aWR0aDogY2FsYygxMDAlIC0gMnJlbSk7XG4gICAgICBoZWlnaHQ6IGNhbGMoMTAwJSAtIDJyZW0pO1xuICAgIH1cbiAgfVxuXG4gIC5xdWlrcGlrLWJvZHktZml0IHtcbiAgICBoZWlnaHQ6IGF1dG87XG4gICAgbWF4LXdpZHRoOiAyNHJlbTtcbiAgICBwYWRkaW5nOiAxLjVyZW07XG4gIH1cblxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnRkUsUUFBUSxlQUFDLENBQUMsQUFDUixRQUFRLENBQUUsS0FBSyxDQUNmLEdBQUcsQ0FBRSxDQUFDLENBQ04sSUFBSSxDQUFFLENBQUMsQ0FDUCxLQUFLLENBQUUsQ0FBQyxDQUNSLE1BQU0sQ0FBRSxDQUFDLENBQ1QsT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixlQUFlLENBQUUsTUFBTSxDQUN2QixXQUFXLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztNQUNyRixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUM7TUFDaEYsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FDbkMsT0FBTyxDQUFFLEtBQUssQUFDaEIsQ0FBQyxBQUVELHVCQUFRLFFBQVEsQUFBQyxDQUFDLEFBQ2hCLE9BQU8sQ0FBRSxFQUFFLENBQ1gsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLENBQUMsQ0FDTixJQUFJLENBQUUsQ0FBQyxDQUNQLE1BQU0sQ0FBRSxDQUFDLENBQ1QsS0FBSyxDQUFFLENBQUMsQ0FDUixVQUFVLENBQUUsT0FBTyxDQUNuQixPQUFPLENBQUUsSUFBSSxDQUNiLE9BQU8sQ0FBRSxLQUFLLEFBQ2hCLENBQUMsQUFFRCxXQUFXLHlCQUFXLENBQUMsQUFDckIsRUFBRSxBQUFDLENBQUMsQUFDRixPQUFPLENBQUUsQ0FBQyxDQUNWLFNBQVMsQ0FBRSxXQUFXLElBQUksQ0FBQyxBQUM3QixDQUFDLEFBQ0QsSUFBSSxBQUFDLENBQUMsQUFDSixPQUFPLENBQUUsQ0FBQyxDQUNWLFNBQVMsQ0FBRSxXQUFXLENBQUMsQ0FBQyxBQUMxQixDQUFDLEFBQ0gsQ0FBQyxBQUVELGFBQWEsZUFBQyxDQUFDLEFBQ2IsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsT0FBTyxDQUFFLE1BQU0sQ0FDZixhQUFhLENBQUUsTUFBTSxDQUNyQixVQUFVLENBQUUsTUFBTSxDQUNsQixTQUFTLENBQUUsUUFBUSxDQUNuQixPQUFPLENBQUUsS0FBSyxDQUNkLEtBQUssQ0FBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ3pCLE1BQU0sQ0FBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzFCLFNBQVMsQ0FBRSxNQUFNLENBQ2pCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFVBQVUsQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNyRixPQUFPLENBQUUsSUFBSSxDQUNiLFNBQVMsQ0FBRSx5QkFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN6QyxPQUFPLENBQUUsSUFBSSxDQUNiLFFBQVEsQ0FBRSxNQUFNLEFBQ2xCLENBQUMsQUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUN6QyxhQUFhLGVBQUMsQ0FBQyxBQUNiLE9BQU8sQ0FBRSxDQUFDLENBQ1YsS0FBSyxDQUFFLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDeEIsTUFBTSxDQUFFLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQUFDM0IsQ0FBQyxBQUNILENBQUMsQUFFRCxpQkFBaUIsZUFBQyxDQUFDLEFBQ2pCLE1BQU0sQ0FBRSxJQUFJLENBQ1osU0FBUyxDQUFFLEtBQUssQ0FDaEIsT0FBTyxDQUFFLE1BQU0sQUFDakIsQ0FBQyJ9 */";
		append(document.head, style);
	}

	// (59:0) {#if !customProgress || !uploader}
	function create_if_block$3(ctx) {
		var div1, div0, current_block_type_index, if_block, current, dispose;

		var if_block_creators = [
			create_if_block_1$2,
			create_else_block$1
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (ctx.uploader) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				if_block.c();
				div0.className = "quikpik-body svelte-1kh5i0t";
				toggle_class(div0, "quikpik-body-fit", ctx.uploader);
				add_location(div0, file_1$3, 60, 4, 1440);
				div1.className = "quikpik svelte-1kh5i0t";
				add_location(div1, file_1$3, 59, 2, 1397);

				dispose = [
					listen(div0, "click", cancelEvent),
					listen(div1, "click", ctx.close)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				if_blocks[current_block_type_index].m(div0, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(div0, null);
				}

				if (changed.uploader) {
					toggle_class(div0, "quikpik-body-fit", ctx.uploader);
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				if_blocks[current_block_type_index].d();
				run_all(dispose);
			}
		};
	}

	// (68:6) {:else}
	function create_else_block$1(ctx) {
		var t, current_block_type_index, if_block, if_block_anchor, current;

		var nav = new Quikpik_nav({
			props: {
			mode: ctx.mode,
			setMode: ctx.setMode,
			sources: ctx.sources
		},
			$$inline: true
		});

		var if_block_creators = [
			create_if_block_2$2,
			create_else_block_1
		];

		var if_blocks = [];

		function select_block_type_1(ctx) {
			if (ctx.mode === 'pickfile') return 0;
			return 1;
		}

		current_block_type_index = select_block_type_1(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c: function create() {
				nav.$$.fragment.c();
				t = space();
				if_block.c();
				if_block_anchor = empty();
			},

			m: function mount(target, anchor) {
				mount_component(nav, target, anchor);
				insert(target, t, anchor);
				if_blocks[current_block_type_index].m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var nav_changes = {};
				if (changed.mode) nav_changes.mode = ctx.mode;
				if (changed.setMode) nav_changes.setMode = ctx.setMode;
				if (changed.sources) nav_changes.sources = ctx.sources;
				nav.$set(nav_changes);

				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_1(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},

			i: function intro(local) {
				if (current) return;
				nav.$$.fragment.i(local);

				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				nav.$$.fragment.o(local);
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				nav.$destroy(detaching);

				if (detaching) {
					detach(t);
				}

				if_blocks[current_block_type_index].d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	// (66:6) {#if uploader}
	function create_if_block_1$2(ctx) {
		var current;

		var uploadprogress = new Upload_progress({
			props: {
			progress: ctx.progress,
			file: ctx.file
		},
			$$inline: true
		});

		return {
			c: function create() {
				uploadprogress.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(uploadprogress, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var uploadprogress_changes = {};
				if (changed.progress) uploadprogress_changes.progress = ctx.progress;
				if (changed.file) uploadprogress_changes.file = ctx.file;
				uploadprogress.$set(uploadprogress_changes);
			},

			i: function intro(local) {
				if (current) return;
				uploadprogress.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				uploadprogress.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				uploadprogress.$destroy(detaching);
			}
		};
	}

	// (72:8) {:else}
	function create_else_block_1(ctx) {
		var current;

		var mediapicker = new Media_picker({
			props: {
			uploadFile: ctx.uploadFile,
			mode: ctx.mode
		},
			$$inline: true
		});

		return {
			c: function create() {
				mediapicker.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(mediapicker, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var mediapicker_changes = {};
				if (changed.uploadFile) mediapicker_changes.uploadFile = ctx.uploadFile;
				if (changed.mode) mediapicker_changes.mode = ctx.mode;
				mediapicker.$set(mediapicker_changes);
			},

			i: function intro(local) {
				if (current) return;
				mediapicker.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				mediapicker.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				mediapicker.$destroy(detaching);
			}
		};
	}

	// (70:8) {#if mode === 'pickfile'}
	function create_if_block_2$2(ctx) {
		var current;

		var filepicker = new File_picker({
			props: { uploadFile: ctx.uploadFile },
			$$inline: true
		});

		return {
			c: function create() {
				filepicker.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(filepicker, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var filepicker_changes = {};
				if (changed.uploadFile) filepicker_changes.uploadFile = ctx.uploadFile;
				filepicker.$set(filepicker_changes);
			},

			i: function intro(local) {
				if (current) return;
				filepicker.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				filepicker.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				filepicker.$destroy(detaching);
			}
		};
	}

	function create_fragment$7(ctx) {
		var if_block_anchor, current, dispose;

		var if_block = (!ctx.customProgress || !ctx.uploader) && create_if_block$3(ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
				dispose = listen(window, "keydown", ctx.closeOnEscape);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!ctx.customProgress || !ctx.uploader) {
					if (if_block) {
						if_block.p(changed, ctx);
						if_block.i(1);
					} else {
						if_block = create_if_block$3(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}

				dispose();
			}
		};
	}

	function cancelEvent(e) {
	  e.stopPropagation();
	}

	function instance$7($$self, $$props, $$invalidate) {
		

	  // The upload function, passed into quikpik opts
	  let { upload, customProgress = false, sources = ['filepicker', 'takephoto', 'takevideo', 'takeaudio'], close, uploader } = $$props;

	  let mode = 'pickfile';
	  let file;
	  let progress = 0;

	  function setMode(newMode) {
	    $$invalidate('mode', mode = newMode);
	  }

	  function onProgress(newProgress) {
	    $$invalidate('progress', progress = newProgress);
	  }

	  function uploadFile(newFile) {
	    if (!newFile) {
	      return;
	    }

	    $$invalidate('file', file = newFile);
	    $$invalidate('uploader', uploader = upload({ file, onProgress }));

	    // Give the user a bit of time to see that we've completed.
	    uploader.promise
	      .then(() => setTimeout(close, 750))
	      .catch((err) => {
	        if (err && err.status !== 0) {
	          alert('Upload failed. ' + (err.message || ''));
	        }
	      });
	  }

	  function closeOnEscape(e) {
	    if (e.key === 'Escape' || e.code === 'Escape') {
	      close();
	    }
	  }

		$$self.$set = $$props => {
			if ('upload' in $$props) $$invalidate('upload', upload = $$props.upload);
			if ('customProgress' in $$props) $$invalidate('customProgress', customProgress = $$props.customProgress);
			if ('sources' in $$props) $$invalidate('sources', sources = $$props.sources);
			if ('close' in $$props) $$invalidate('close', close = $$props.close);
			if ('uploader' in $$props) $$invalidate('uploader', uploader = $$props.uploader);
		};

		return {
			upload,
			customProgress,
			sources,
			close,
			uploader,
			mode,
			file,
			progress,
			setMode,
			uploadFile,
			closeOnEscape
		};
	}

	class Quikpik extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1kh5i0t-style")) add_css$7();
			init(this, options, instance$7, create_fragment$7, safe_not_equal, ["upload", "customProgress", "sources", "close", "uploader"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.upload === undefined && !('upload' in props)) {
				console.warn("<Quikpik> was created without expected prop 'upload'");
			}
			if (ctx.customProgress === undefined && !('customProgress' in props)) {
				console.warn("<Quikpik> was created without expected prop 'customProgress'");
			}
			if (ctx.sources === undefined && !('sources' in props)) {
				console.warn("<Quikpik> was created without expected prop 'sources'");
			}
			if (ctx.close === undefined && !('close' in props)) {
				console.warn("<Quikpik> was created without expected prop 'close'");
			}
			if (ctx.uploader === undefined && !('uploader' in props)) {
				console.warn("<Quikpik> was created without expected prop 'uploader'");
			}
		}

		get upload() {
			return this.$$.ctx.upload;
		}

		set upload(upload) {
			this.$set({ upload });
			flush();
		}

		get customProgress() {
			return this.$$.ctx.customProgress;
		}

		set customProgress(customProgress) {
			this.$set({ customProgress });
			flush();
		}

		get sources() {
			return this.$$.ctx.sources;
		}

		set sources(sources) {
			this.$set({ sources });
			flush();
		}

		get close() {
			return this.$$.ctx.close;
		}

		set close(close) {
			this.$set({ close });
			flush();
		}

		get uploader() {
			return this.$$.ctx.uploader;
		}

		set uploader(uploader) {
			this.$set({ uploader });
			flush();
		}
	}

	/**
	 * Create and show the file picker.
	 *
	 * @param {Object} opts
	 * @param {boolean} opts.customProgress
	 * @param {string[]} opts.sources the allowable file sources
	 * @param {function} opts.upload the upload function { file, onProgress() } => { promise, cancel() }
	 */
	function quikpik(opts) {
	  const root = document.createElement('div');

	  document.body.appendChild(root);

	  function close() {
	    if (app.uploader) {
	      app.uploader.cancel();
	    }

	    root.remove();
	  }

	  const app = new Quikpik({
	    target: root,
	    props: {
	      ...opts,
	      uploader: undefined,
	      close,
	    },
	  });

	  return {
	    close,
	  };
	}

	/* src/App.svelte generated by Svelte v3.0.0 */

	const file$4 = "src/App.svelte";

	function add_css$8() {
		var style = element("style");
		style.id = 'svelte-1e9puaw-style';
		style.textContent = "main.svelte-1e9puaw{text-align:center;padding:1em;max-width:240px;margin:0 auto}h1.svelte-1e9puaw{color:#ff3e00;text-transform:uppercase;font-size:4em;font-weight:100}@media(min-width: 640px){main.svelte-1e9puaw{max-width:none}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbiAgaW1wb3J0IHF1aWtwaWsgZnJvbSAnLi4vbGliJztcblxuICBmdW5jdGlvbiBtb2NrVXBsb2FkKHsgZmlsZSwgb25Qcm9ncmVzcyB9KSB7XG4gICAgY29uc29sZS5sb2coJ1VwbG9hZGluZyBmaWxlOicsIGZpbGUubmFtZSwgJ3R5cGU6JywgZmlsZS50eXBlKTtcblxuICAgIGNvbnN0IG1vY2tQcm9ncmVzc0ludGVydmFsID0gMjUwO1xuICAgIGxldCBwcm9ncmVzcyA9IDA7XG4gICAgbGV0IHJlc29sdmUsIHJlamVjdCwgdGltZW91dDtcblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHJlc29sdmUgPSByZXM7XG4gICAgICByZWplY3QgPSByZWo7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChtb2NrUHJvZ3Jlc3MsIG1vY2tQcm9ncmVzc0ludGVydmFsKTtcblxuICAgICAgZnVuY3Rpb24gbW9ja1Byb2dyZXNzKCkge1xuICAgICAgICBwcm9ncmVzcyArPSAxMDtcbiAgICAgICAgb25Qcm9ncmVzcyhwcm9ncmVzcyk7XG5cbiAgICAgICAgaWYgKHByb2dyZXNzID49IDEwMCkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KG1vY2tQcm9ncmVzcywgbW9ja1Byb2dyZXNzSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvbWlzZSxcblxuICAgICAgY2FuY2VsKCkge1xuICAgICAgICAvLyBSZWplY3Qgc2hvdWxkIGRvIHdoYXRldmVyIFhNTEh0dHBSZXF1ZXN0IGFib3J0IGRvZXM6XG4gICAgICAgIC8vIFRoZSBYTUxIdHRwUmVxdWVzdC5hYm9ydCgpIG1ldGhvZCBhYm9ydHMgdGhlIHJlcXVlc3QgaWYgaXQgaGFzIGFscmVhZHkgYmVlbiBzZW50LiBXaGVuIGEgcmVxdWVzdCBpcyBhYm9ydGVkLCBpdHMgcmVhZHlTdGF0ZSBpcyBjaGFuZ2VkIHRvIFhNTEh0dHBSZXF1ZXN0LlVOU0VOVCAoMCkgYW5kIHRoZSByZXF1ZXN0J3Mgc3RhdHVzIGNvZGUgaXMgc2V0IHRvIDAuXG4gICAgICAgIGNvbnNvbGUubG9nKCdJIHdhcyBjYW5jZWxlZCEnKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICByZXR1cm4gcmVqZWN0ICYmIHJlamVjdCh7IHN0YXR1czogMCB9KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIHF1aWtwaWsoe1xuICAgICAgdXBsb2FkOiBtb2NrVXBsb2FkLFxuICAgIH0pO1xuICB9KTtcbjwvc2NyaXB0PlxuXG48bWFpbj5cbiAgPGgxPlF1aWtwaWs8L2gxPlxuICA8YnV0dG9uXG4gICAgdHlwZT1cImJ1dHRvblwiXG4gICAgb246Y2xpY2s9eygpID0+XG4gICAgICBxdWlrcGlrKHtcbiAgICAgICAgdXBsb2FkOiBtb2NrVXBsb2FkLFxuICAgICAgICBzb3VyY2VzOiBbJ2ZpbGVwaWNrZXInXSxcbiAgICAgIH0pXG4gICAgfVxuICA+XG4gICAgVGhlcmUgY2FuIGJlIG9ubHkgb25lXG4gIDwvYnV0dG9uPlxuICA8YnV0dG9uXG4gICAgdHlwZT1cImJ1dHRvblwiXG4gICAgb246Y2xpY2s9eyhlKSA9PlxuICAgICAgcXVpa3Bpayh7XG4gICAgICAgIGN1c3RvbVByb2dyZXNzOiB0cnVlLFxuXG4gICAgICAgIHVwbG9hZCh7IGZpbGUgfSkge1xuICAgICAgICAgIHJldHVybiBtb2NrVXBsb2FkKHtcbiAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgIGUudGFyZ2V0LnRleHRDb250ZW50ID0gYCR7cHJvZ3Jlc3N9JWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9XG4gID5cbiAgICBDdXN0b20gcHJvZ3Jlc3NcbiAgPC9idXR0b24+XG48L21haW4+XG5cbjxzdHlsZT5cbiAgbWFpbiB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIHBhZGRpbmc6IDFlbTtcbiAgICBtYXgtd2lkdGg6IDI0MHB4O1xuICAgIG1hcmdpbjogMCBhdXRvO1xuICB9XG5cbiAgaDEge1xuICAgIGNvbG9yOiAjZmYzZTAwO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgZm9udC1zaXplOiA0ZW07XG4gICAgZm9udC13ZWlnaHQ6IDEwMDtcbiAgfVxuXG4gIEBtZWRpYSAobWluLXdpZHRoOiA2NDBweCkge1xuICAgIG1haW4ge1xuICAgICAgbWF4LXdpZHRoOiBub25lO1xuICAgIH1cbiAgfVxuPC9zdHlsZT4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBbUZFLElBQUksZUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLE1BQU0sQ0FDbEIsT0FBTyxDQUFFLEdBQUcsQ0FDWixTQUFTLENBQUUsS0FBSyxDQUNoQixNQUFNLENBQUUsQ0FBQyxDQUFDLElBQUksQUFDaEIsQ0FBQyxBQUVELEVBQUUsZUFBQyxDQUFDLEFBQ0YsS0FBSyxDQUFFLE9BQU8sQ0FDZCxjQUFjLENBQUUsU0FBUyxDQUN6QixTQUFTLENBQUUsR0FBRyxDQUNkLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMsQUFFRCxNQUFNLEFBQUMsWUFBWSxLQUFLLENBQUMsQUFBQyxDQUFDLEFBQ3pCLElBQUksZUFBQyxDQUFDLEFBQ0osU0FBUyxDQUFFLElBQUksQUFDakIsQ0FBQyxBQUNILENBQUMifQ== */";
		append(document.head, style);
	}

	function create_fragment$8(ctx) {
		var main, h1, t1, button0, t3, button1, dispose;

		return {
			c: function create() {
				main = element("main");
				h1 = element("h1");
				h1.textContent = "Quikpik";
				t1 = space();
				button0 = element("button");
				button0.textContent = "There can be only one";
				t3 = space();
				button1 = element("button");
				button1.textContent = "Custom progress";
				h1.className = "svelte-1e9puaw";
				add_location(h1, file$4, 49, 2, 1242);
				button0.type = "button";
				add_location(button0, file$4, 50, 2, 1261);
				button1.type = "button";
				add_location(button1, file$4, 61, 2, 1443);
				main.className = "svelte-1e9puaw";
				add_location(main, file$4, 48, 0, 1233);

				dispose = [
					listen(button0, "click", ctx.click_handler),
					listen(button1, "click", ctx.click_handler_1)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, main, anchor);
				append(main, h1);
				append(main, t1);
				append(main, button0);
				append(main, t3);
				append(main, button1);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(main);
				}

				run_all(dispose);
			}
		};
	}

	function mockUpload({ file, onProgress }) {
	  console.log('Uploading file:', file.name, 'type:', file.type);

	  const mockProgressInterval = 250;
	  let progress = 0;
	  let resolve, reject, timeout;

	  const promise = new Promise((res, rej) => {
	    resolve = res;
	    reject = rej;
	    timeout = setTimeout(mockProgress, mockProgressInterval);

	    function mockProgress() {
	      progress += 10;
	      onProgress(progress);

	      if (progress >= 100) {
	        resolve();
	      } else {
	        setTimeout(mockProgress, mockProgressInterval);
	      }
	    }
	  });

	  return {
	    promise,

	    cancel() {
	      // Reject should do whatever XMLHttpRequest abort does:
	      // The XMLHttpRequest.abort() method aborts the request if it has already been sent. When a request is aborted, its readyState is changed to XMLHttpRequest.UNSENT (0) and the request's status code is set to 0.
	      console.log('I was canceled!');
	      clearTimeout(timeout);
	      return reject && reject({ status: 0 });
	    },
	  };
	}

	function instance$8($$self, $$props, $$invalidate) {
		

	  onMount(() => {
	    quikpik({
	      upload: mockUpload,
	    });
	  });

		function click_handler() {
			return quikpik({
		        upload: mockUpload,
		        sources: ['filepicker'],
		      });
		}

		function click_handler_1(e) {
			return quikpik({
		        customProgress: true,

		        upload({ file }) {
		          return mockUpload({
		            file,
		            onProgress(progress) {
		              e.target.textContent = `${progress}%`; $$invalidate('e', e);
		            },
		          });
		        },
		      });
		}

		return { click_handler, click_handler_1 };
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			if (!document.getElementById("svelte-1e9puaw-style")) add_css$8();
			init(this, options, instance$8, create_fragment$8, safe_not_equal, []);
		}
	}

	const app = new App({
	  target: document.body,
	  props: {},
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
