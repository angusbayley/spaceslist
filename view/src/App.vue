<template>
  <div class="container">
    <h1>Hackney Wick spaces all-posts-in-one-page megalist 2000!!!!1</h1>
    <hr>
    <div class="slider-container">
        <h4>Price range</h4>
        <vue-slider ref="slider" v-model="priceLimits" v-bind="sliderOptions"></vue-slider>    
    </div>
    <table class="posts">
      <tr>
        <th>what is this</th>
        <th>well WHERE IS IT??</th>
        <th>short-term?</th>
        <th>cheddar</th>
        <th>posted</th>
      </tr>
      <tr v-for="item in listings">
        <td class="listing-title"><div class="td-inner"><a v-bind:href="item.url">{{item.title || "they couldn't even be BOTHERED to write a title"}}</a></div></td>
        <td class="listing-location"><div class="td-inner">{{item.location}}</div></td>
        <td><div v-if="item.sublet" v-html="'&#x2705;'"></div></td>
        <td>{{item.price}}</td>
        <td>{{moment(item.posted_at).fromNow()}}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import moment from 'moment'
import vueSlider from 'vue-slider-component'

export default {
  data () {
    return {
      url: "https://europe-west1-hackney-wick-spaces-viewer.cloudfunctions.net/serveListings",
      completeListings: [],
      priceLimits: [500, 800],
      sliderOptions: {
        min: 0,
        max: 1200
      }
    }
  },
  methods: {
    getListings() {
      axios({method: "GET", url: this.url}).then(response => {
        this.completeListings = response.data;
      }, error => {
        console.log(error)
      });
    },
    moment(date) {
      return moment(date)
    }
  },
  computed: {
    listings: function() {
      return this.completeListings.filter(l => {
        return l.price < this.priceLimits[1] && l.price > this.priceLimits[0]
      })
    }
  },
  created() {
    this.getListings()
  },
  components: {
    vueSlider
  }
}
</script>