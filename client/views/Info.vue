<template>
	<div class="cont">
		<div class="el1">
			<p>1</p>
			<p>{{ Math.round((windowWidth/4*1) / windowWidth * 100) }}</p>
		</div>
		<div class="el2">
			<p>2</p>
			<p>{{ Math.round((windowWidth/4*1) / windowWidth * 100) }}</p>
		</div>
		<div class="el3">
			<p>3</p>
			<p>{{ Math.round((windowWidth/4*2) / windowWidth * 100) }}</p>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			windowWidth: 0,
			windowHeight: 0
		}
	},
	components: {
	},
	beforeRouteEnter (to, from, next) {
		next()
	},
  mounted() {
    this.$nextTick(function() {
      window.addEventListener('resize', this.getWindowWidth);
      window.addEventListener('resize', this.getWindowHeight);

      //Init
      this.getWindowWidth()
      this.getWindowHeight()
    })
  },
  methods: {
    getWindowWidth(event) {
      this.windowWidth = document.documentElement.clientWidth;
    },

		getWindowHeight(event) {
			this.windowHeight = document.documentElement.clientHeight;
		}
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.getWindowWidth);
    window.removeEventListener('resize', this.getWindowHeight);
  }
}
</script>

<style lang="css">
	.cont {
		display: flex;
		justify-content: space-around;
		flex-direction: row;
	}

	.cont div {
		text-align: center;
		background-color: aqua;
		border: 1px black solid;
		width: 150px;
		/* height: 100px; */
	}

	/* .cont div:nth-of-type(1n+2) {
		margin-left: 20px;
	} */

	.el1 {
		flex: 1;
	}

	.el2 {
		flex: 1;
	}

	.el3 {
		flex: 2;
		/* align-self: flex-start; */
		/* margin-left: auto; */
	}
</style>
