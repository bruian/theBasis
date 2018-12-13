<template>
	<div class="ItmTextAreaLine">
		<div class="ItmTextAreaBox">
			<textarea @change="onChange" @focus="resize" v-model="val" :style="computedStyle" class="ItmTextArea effect-3" rows="1"></textarea>
			<span class="focus-border"></span>
			<!-- <i href="#" class="input-change" @click.prevent="removeTag(index)"></i> -->
		</div>
		<v-icon v-if="changeButton" @click="onChangeButton" color="primary" style="align-self: flex-start;">done</v-icon>
	</div>
</template>

<script>
export default {
	name: 'ItmTextArea',
	created () {
		this.updateVal()
	},
	mounted () {
		this.resize()
	},
	props: {
		value: {
			type: [String, Number],
			default: ''
		},
		autosize: {
			type: Boolean,
			default: true
		},
		minHeight: {
			type: Number,
			'default': null
		},
		maxHeight: {
			type: Number,
			'default': null
		},
		important: {
			type: [Boolean, Array],
			default: false
		}
	},
	data () {
		return {
			val: null,
			maxHeightScroll: false,
			changeButton: false
		}
	},
	computed: {
		computedStyle () {
			let objStyle = {}

			if (this.autosize) {
				objStyle.resize = !this.isResizeImportant ? 'none' : 'none !important'
				if (!this.maxHeightScroll) {
					objStyle.overflow = !this.isOverflowImportant ? 'hidden' : 'hidden !important'
				}
			}

			return objStyle
		},
		isResizeImportant () {
			const imp = this.important
			return imp === true || (Array.isArray(imp) && imp.includes('resize'))
		},
		isOverflowImportant () {
			const imp = this.important
			return imp === true || (Array.isArray(imp) && imp.includes('overflow'))
		},
		isHeightImportant () {
			const imp = this.important
			return imp === true || (Array.isArray(imp) && imp.includes('height'))
		}
	},
	methods: {
		onChange: function(e) {
			this.changeButton = false
			this.$emit('change', e.target.value)
		},
		onChangeButton: function() {
			this.changeButton = false
			this.$emit('change', this.val)
		},
		updateVal () {
			this.val = this.value
		},
		resize () {
			const important = this.isHeightImportant ? 'important' : ''

			this.$el.children[0].style.setProperty('height', 'auto', important)

			let contentHeight = this.$el.children[0].children[0].scrollHeight + 1

			if (this.minHeight) {
				contentHeight = contentHeight < this.minHeight ? this.minHeight : contentHeight
			}

			if (this.maxHeight) {
				if (contentHeight > this.maxHeight) {
					contentHeight = this.maxHeight
					this.maxHeightScroll = true
				} else {
					this.maxHeightScroll = false
				}
			}

			const heightVal = contentHeight + 'px'
			this.$el.children[0].style.setProperty('height', heightVal, important)

			return this
		}
	},
	watch: {
		value () {
			this.updateVal()
			this.changeButton = true
		},
		val (val) {
			this.$nextTick(this.resize)
			this.$emit('input', val)
		}
	}
}
</script>

<style lang="css">
.ItmTextAreaLine {
	display: flex;
	flex-direction: row;
}

.ItmTextAreaBox {
	width: 100%;
	display: flex;
	flex-direction: column;
	margin-top: 1px;
	align-content: flex-start;
}

.ItmTextArea {
	width: 100%;
	flex: 1 1;
	height: 24px;
}
:focus{outline: none;}

.effect-3 {
	border: 0;
	border-bottom: 1px solid #ccc;
}

.effect-3 ~ .focus-border { position: relative; bottom: 0; left: 0; width: 100%; height: 1px; z-index: 99; }
.effect-3 ~ .focus-border:before,
.effect-3 ~ .focus-border:after{content: ""; position: absolute; bottom: 0; left: 0; width: 0; height: 100%; background-color: #4caf50; transition: 0.4s;}
.effect-3 ~ .focus-border:after{left: auto; right: 0;}
.effect-3:focus ~ .focus-border:before,
.effect-3:focus ~ .focus-border:after{width: 50%; transition: 0.4s;}
</style>
