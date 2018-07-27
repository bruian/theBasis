<template>
	<div class="layout">
		<Layout :style="{ minHeight: '100vh' }">
			<Sider collapsible :collapsed-width="78" v-model="isCollapsed">
				<Menu active-name="1-2" theme="dark" width="auto" :class="menuitemClasses">
					<i-menu-item name="1-1">
						<Icon type="ios-navigate"></Icon>
						<span>Option 1</span>
					</i-menu-item>
					<i-menu-item name="1-2">
						<Icon type="search"></Icon>
						<span>Option 2</span>
					</i-menu-item>
				</Menu>
			</Sider>
			<Layout>
				<Header :style="{ background: '#fff', boxShadow: '0 2px 3px 2px rgba(0,0,0,.1)', position: 'fixed', width: '100%' }">Hello</Header>
				<Content :style="{ padding: '0 16px 16px', margin: '78px 20px 0', position: 'static' }">
					<Breadcrumb :style="{margin: '16px 0'}">
						<BreadcrumbItem>Home</BreadcrumbItem>
						<BreadcrumbItem>Components</BreadcrumbItem>
						<BreadcrumbItem>Layout</BreadcrumbItem>
					</Breadcrumb>
					<Card>
						<div>
							<Row>
								<i-col span="12">
									<Card>
										<p slot="title">The standard card</p>
										<p>Is mobile = {{ isMobile }}</p>
										<p>Content of card</p>
										<p>Content of card</p>
									</Card>
								</i-col>
								<i-col span="8" offset="4">
									<Card>
										<p slot="title">The standard card</p>
										<p>Content of card</p>
										<p>Content of card</p>
										<p>Content of card</p>
									</Card>
								</i-col>
							</Row>
							<Row v-for="rowI in 10" :key="rowI">
								<Col>
									<Card>
										<p slot="title">The standard card</p>
										<p>Content of card</p>
										<p>Content of card</p>
										<p>Content of card</p>
									</Card>
								</Col>
							</Row>
						</div>
					</Card>
				</Content>
			</Layout>
		</Layout>
	</div>
</template>

<script>
export default {
	name: 'AppGrid',
	data: () => ({
		isCollapsed: false,
		isMobile: false
  }),
  computed: {
    menuitemClasses: function() {
      return [
        'menu-item',
        this.isCollapsed ? 'collapsed-menu' : ''
      ]
    }
  },
	mounted() {
		this.onResize()
		window.addEventListener('resize', this.onResize, { passive: true} )
	},
	beforeDestroy() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', this.onResize, { passive: true } )
		}
	},
	methods: {
		onResize() {
			this.isMobile = window.innerWidth < 600
		}
	}
}
</script>

<style lang='stylus' scoped>
.layout
  border 1px solid #d7dde4
  background #f5f7f9
  position relative
  border-radius 4px
  overflow hidden
.layout-con
  height 100%
  width 100%
.menu-item
  span
    display inline-block
    overflow hidden
    width 69px
    text-overflow ellipsis
    white-space nowrap
    vertical-align bottom
    transition width .2s ease .2s
  i
    transform translateX(0px)
    transition font-size .2s ease, transform .2s ease
    vertical-align middle
    font-size 16px
.collapsed-menu
  span
    width 0px
    transition width .2s ease
  i
    transform translateX(5px)
    transition font-size .2s ease .2s, transform .2s ease .2s
    vertical-align middle
    font-size 22px
</style>
