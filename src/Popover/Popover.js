/**
 * @file Popover
 * @author leon <ludafa@outlook.com>
 */

import Layer from '../Layer';
import {create} from '../common/util/cx';
import align from 'dom-align';
import {DataTypes} from 'san';
import {throttle} from '../common/util/throttle';

const cx = create('popover');
const INITIAL_POSITION_STYLE = 'top: -9999px; left: -9999px';
const ORIGIN_STYLE_MAP = {
    t: 'top',
    c: 'center',
    b: 'bottom',
    l: 'left',
    r: 'right'
};

export default class Popover extends Layer {

    static template = `
        <div class="{{mainClassName}}" on-click="click($event)">
            <div
                class="${cx.getPartClassName('content')}"
                style="${INITIAL_POSITION_STYLE}"
                on-transitionend="transitionEnd">
                <slot />
            </div>
        </div>
    `;

    static computed = {
        mainClassName() {
            let closing = this.data.get('closing');
            let open = this.data.get('open');
            let shadow = this.data.get('shadow');

            return cx(this)
                .addVariants(shadow && `shadow-${shadow}`)
                .addStates({
                    open: !closing && open
                })
                .build();
        }
    };

    static dataTypes = {
        maxHeight: DataTypes.number
    };

    initData() {
        return {

            /**
             * 是否展开浮层
             *
             * @type {boolean}
             */
            open: false,

            /**
             * 锚点元素对齐角
             * @type {string}
             */
            anchorOrigin: 'tl',

            /**
             * 浮层元素对齐角
             *
             * @type {string}
             */
            targetOrigin: 'tl',

            /**
             * 浮层元素水平方向位移
             *
             * @type {number}
             */
            offsetX: 0,

            /**
             * 浮层元素垂直方向位移
             *
             * @type {number}
             */
            offsetY: 0,

            /**
             * 最大高度
             *
             * @type {?number}
             */
            maxHeight: null,

            /**
             * 最大宽度
             *
             * @type {?number}
             */
            maxWidth: null,

            shadow: 1,

            /**
             * 是否正在关闭
             *
             * @private
             * @type {boolean}
             */
            closing: false

        };
    }

    inited() {
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.transitionEnd = throttle(
            this.transitionEnd.bind(this),
            1000,
            {trailing: false}
        );
    }

    attached() {
        super.attached();
        this.watch('open', this.updateStatus);
        if (this.data.get('open')) {
            this.show();
        }
        this.transitionEnd();
        this.transitionEnd();
        this.transitionEnd();
        this.transitionEnd();
    }

    updateStatus(open) {
        this[open ? 'show' : 'hide']();
    }

    getContent() {
        return this.el.firstElementChild;
    }

    getTransfromOrigin(origin) {
        let [top, left] = origin;
        return `${ORIGIN_STYLE_MAP[top]} ${ORIGIN_STYLE_MAP[left]}`;
    }

    show() {

        let {
            getAnchor,
            targetOrigin,
            anchorOrigin,
            offsetX,
            offsetY,
            matchAnchorWidth,
            maxHeight,
            maxWidth
        } = this.data.get();

        let anchor = typeof getAnchor === 'function' && getAnchor();

        if (!anchor) {
            return;
        }

        let content = this.getContent();
        let {offsetWidth, offsetHeight} = content;
        if (matchAnchorWidth) {
            content.style.width = `${anchor.offsetWidth}px`;
        }

        // 这里要把 closing 清理掉，要不然在快速点击时有残留；
        this.data.set('closing', false);

        // 设置缩放动画的起点
        content.style.transformOrigin = this.getTransfromOrigin(targetOrigin);

        content.style.maxHeight = maxHeight == null ? 'auto' : `${maxHeight}px`;
        content.style.overflowY = maxHeight == null ? 'visible' : 'auto';
        content.style.maxWidth = maxWidth == null ? 'auto' : `${maxWidth}px`;
        content.style.overflowX = maxWidth == null ? 'auto' : `${maxWidth}px`;

        console.log(offsetWidth, offsetHeight, targetOrigin, anchorOrigin, offsetX, offsetY);

        // 对齐元素
        align(
            this.el.firstElementChild,
            anchor,
            {
                points: [targetOrigin, anchorOrigin],
                offset: [offsetX, offsetY],
                overflow: {
                    adjustX: true,
                    adjustY: true
                },
                useCssTransform: false
            }
        );

        // 绑定 clickAway 处理
        // @hack: 这里延迟绑定 click 事件，已免此次点击事件冒泡到 body 误触发 hide
        setTimeout(() => {
            if (this.data.get('open')) {
                window.addEventListener('click', this.hide);
            }
        }, 1);

        // 滚出视野关闭处理
        // @TODO

    }

    hide() {
        window.removeEventListener('click', this.hide);
        this.data.set('open', false);
        this.data.set('closing', true);
    }

    click(e) {
        e.stopPropagation();
    }

    transitionEnd() {
        if (this.data.get('open')) {
            this.fire('open-complete');
            return;
        }
        this.data.set('closing', false);
        this.data.set('open', false);
        let content = this.getContent();
        content.style.top = 0;
        content.style.left = '-10000px';
        this.fire('close-complete');
    }

}