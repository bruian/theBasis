export default [
	{
		id: 0,
		code:
`class=<span class="o-s">{property}{direction}-{size}</span>
<i>class=<span class="o-s">px-1</span></i>
margin=<code>m</code> or padding=<code>p</code>           {size}
 m || p<code>x</code> - left && right          0 - delete property
 m || p<code>y</code> - top && bottom  1 - set m or p to <code>$spacer * .25</code>
 m || p<code>t</code> - top            2 - set m or p to <code>$spacer * .5</code>
 m || p<code>b</code> - bottom         3 - set m or p to <code>$spacer</code>
 m || p<code>l</code> - left           4 - set m or p to <code>$spacer * 1.5</code>
 m || p<code>r</code> - right          5 - set m or p to <code>$spacer * 3</code>
 m || p<code>a</code> - all`
	},
	{
		id: 1,
		code:
`Breakpoints:
 Extra small: <span class="o-s">xs</span>         &lt  600px
 Small      : <span class="o-s">sm</span>  600px &gt&lt  960px
 Medium     : <span class="o-s">md</span>  960px &gt&lt 1264px*
 Large      : <span class="o-s">lg</span> 1264px &gt&lt 1904px*
 Extra large: <span class="o-s">xl</span>         &gt 1904px*`
	},
	{
		id: 2,
		code:
`Vuetify имеет 12-точечную систему сеток. Построенная с использованием
flex-box , сетка используется для компоновки содержимого приложения.
Она содержит 5 типов точек прерывания, которые используются для ориентации
определенных размеров экрана или ориентации. Реквизиты для компонентов
сетки фактически являются классами, которые получены из их определенных
свойств. Это позволяет вам легко указать эти вспомогательные классы в
качестве свойства, при этом все еще предоставляя классы для использования
в любом месте.`
	},
	{
		id: 3,
		code:
`<code>v-container</code> используется преимущественно для контента ориентированного на центр, в свою очередь содержит
<code>v-layout</code> который используется для деления контента на разделы и тот в свою очередь разбивается на блоки
<code>v-flex</code>. Каждая часть цепочки представляет собой элемент <code>flex-box</code>
&lt;v-container <span class="o-s">text-xs-center</span>&gt;
 &lt;v-card <span class="o-s">class="elevation-0"</span>&gt`
	},
	{
		id: 4,
		code:
`&lt;v-container <span class="o-s">text-xs-center</span>&gt;
 &lt;v-layout&gt;
  &lt;v-flex <span class="o-s">xs12</span>&gt;
   &lt;v-card class="elevation-8"&gt;
  &lt;v-flex <span class="o-s">xs6</span>&gt;
   &lt;v-card class="elevation-8"&gt;
   &lt;v-card class="elevation-8"&gt;`
	},
	{
		id: 5,
		code:
`Устанавливает gutter между элементами списка сетки в диапазоне от 2 до 24 пикселей
&lt;v-container <span class="o-s">text-xs-center</span> <span style="color: red;">grid-list-md</span>&gt;
&lt;v-layout&gt;
 &lt;v-flex <span class="o-s">xs12</span>&gt;
  &lt;v-card class="elevation-8"&gt;
 &lt;v-flex <span class="o-s">xs6</span>&gt;
  &lt;v-card class="elevation-8"&gt;
  &lt;v-card class="elevation-8"&gt;`
	},
	{
		id: 6,
		code:
`&lt;v-container <span class="o-s">text-xs-center grid-list-md</span>&gt;
 &lt;v-layout row <span style="color: red;">wrap</span>&gt;
  &lt;v-flex <span class="o-s">xs12</span>&gt;
   &lt;v-card class="elevation-8"&gt;
  &lt;v-flex <span class="o-s">xs6</span>&gt;
   &lt;v-card class="elevation-8"&gt;`
	},
	{
		id: 7,
		code:
`&lt;v-container <span class="o-s">text-xs-center grid-list-md</span>&gt;
 &lt;v-layout row wrap&gt;
  &lt;v-flex <span class="o-s">xs12</span>&gt;
   &lt;v-card class="elevation-8"&gt;
  &lt;v-flex <span class="o-s">xs6</span> <span style="color: red;">offset-xs6</span>&gt;
	 &lt;v-card class="elevation-8"&gt;`
	}
]
