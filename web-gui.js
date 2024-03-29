const style = document.createElement('style');
style.textContent = `for web-gui`;
document.head.appendChild(style);
style.sheet.insertRule(`
	@keyframes wg-loader {
		from {
			opacity: 1;
		} to {
			opacity: 0;
		}
	}
`);

export default {
	charWrap: function f(node, options = {}, count = 0, path = []) {
		const {
			elem: elemStr = `span`,
			classes,
			listeners,
			data,
		} = options;

		if (node.nodeType === node.TEXT_NODE) {
			const frag = document.createDocumentFragment();
			for (let char of node.textContent) {
				const elem = document.createElement(elemStr);
				if (classes) {
					const classStr = classes(char, count, path).join(` `);
					if (classStr) elem.setAttribute(`class`, classStr);
				}

				if (data)
					for (let dattr of data(char, count, path))
						elem.dataset[dattr[0]] = dattr[1];

				if (listeners)
					for (let listener of listeners(char, count, path))
						elem.addEventListener(listener[0], listener[1]);

				elem.textContent = char;
				frag.appendChild(elem);
				count++
			}

			return {node: frag, count};
		} else {
			for (let child of [...node.childNodes]) {
				const nodeAndCount = f(child, options, count, path.concat([node]));
				count = nodeAndCount.count;
				node.replaceChild(nodeAndCount.node, child);
			}

			return {node, count};
		}
	},
	empty(container) {
		let child;
		while (child = container.firstChild) {
			child.remove();
		}
	},
	popup(elem, {
		reference,
		xe = .5,
		xr = .5,
		ye = .5,
		yr = .5,
		dim = 0x55,
		boxShadow = `0 0 10px`,
		zIndex = Number.MAX_SAFE_INTEGER,
	} = {}, callback = background => background.remove()) {
		const background = document.createElement(`div`);
		reference = reference || background;
		Object.assign(background.style, {
			position: `fixed`,
			background: `#000000` + dim.toString(16),
			left: 0,
			top: 0,
			width: `100%`,
			height: `100%`,
			zIndex,
		})

		background.addEventListener(`mousedown`, function(e) {
			if (!e.composedPath().includes(elem)) {
				callback.call(elem, background, reference);
				window.removeEventListener(`resize`, position);
			};
		});

		Object.assign(elem.style, {
			position: `fixed`,
			boxShadow,
		})

		background.appendChild(elem);
		document.body.appendChild(background);
		(new MutationObserver(function(){
			this.disconnect();
			background.remove();
			window.removeEventListener(`resize`, position);
		})).observe(background, {childList: true});

		function position() {
			const dims = reference.getBoundingClientRect();
			Object.assign(elem.style, {
				left: dims.left + xr * dims.width - xe * elem.offsetWidth + `px`,
				top: dims.top + yr * dims.height - ye * elem.offsetHeight + `px`,
			});
		}

		position();
		window.addEventListener(`resize`, position);
	},
	place(elem, {
		reference = document.body,
		xe = .5,
		xr = .5,
		ye = .5,
		yr = .5,
		zIndex = Number.MAX_SAFE_INTEGER,
	} = {}) {
		Object.assign(elem.style, {
			position: `absolute`,
			zIndex,
		});

		document.body.appendChild(elem);

		function positionElem() {
			const dims = reference.getBoundingClientRect();
			Object.assign(elem.style, {
				left: dims.left + xr * dims.width - xe * elem.offsetWidth + `px`,
				top: dims.top + yr * dims.height - ye * elem.offsetHeight + `px`,
			});
		}

		positionElem();
		window.addEventListener(`resize`, positionElem);
	},
	waitFrames(n) {
		const iterate = function f(n, callback) {
			if (n === 0) callback();
			else requestAnimationFrame(()=> f(n - 1, callback));
		}

		return new Promise(resolve => iterate(n, resolve));
	},
	loader({
		size = `1em`,
		disks = 6,
		spacing = 1 / 3,
		color = `#0005`,
		period = 1,
		} = {}
	) {
		const loaderElem = document.createElement(`div`);
		loaderElem.classList.add(`wg-loader`);
		Object.assign(loaderElem.style, {
			width: size,
			height: size,
		});

		console.log(spacing);
		for (let i = 0; i <= disks - 1; i++) {
			const
				disk = document.createElement(`div`),
				//diskSize = `calc(${Math.PI} * ${size} / ${n})`;
				diskSize = `calc(${1 - spacing} * ${size} / ${1 - spacing + 1 / Math.sin(Math.PI / disks)})`;

			Object.assign(disk.style, {
				width: diskSize,
				height: diskSize,
				borderRadius: `calc(${diskSize} / 2)`,
				background: color,
				position: `absolute`,
				transformOrigin: `center calc(${size} / 2)`,
				transform: `translateX(calc((${size} - ${diskSize}) / 2)) rotate(${i / disks}turn)`,
				animation: `${period}s linear ${period * (i - disks) / disks}s infinite wg-loader`,
			});
			loaderElem.appendChild(disk);
		}

		return loaderElem;
	},
	transWait(elem) {
		return new Promise(resolve => {
			elem.addEventListener(`transitionend`, function eh() {
				elem.removeEventListener(`transitionend`, eh);
				resolve();
			});
		})
	},
}
