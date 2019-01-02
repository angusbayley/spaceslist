<template>
  <div class="container">
    <h1 class="mt-4">Hackney Wick Spaces all-posts-in-one-page megalist</h1>
    <p class="mb-4">All of the posts from the <a href="https://www.facebook.com/groups/HWSpaces/">Hackney Wick Spaces facebook group</a>, listed chronologically and filterable by price, as god intended.</p>
    <hr>
    <div class="row">
        <div class="col-md-2 price-label"><h5>price range (£):</h5></div>
        <div class="col-md-10 price-slider-container">
          <vue-slider ref="slider" v-model="priceLimits" v-bind="sliderOptions"></vue-slider>
        </div>
    </div>
    <table class="posts">
      <tr>
        <th>what</th>
        <th>where</th>
        <th>short-term?</th>
        <th>cheddar</th>
        <th>posted</th>
      </tr>
      <tr v-for="item in listings">
        <td class="text-truncate listing-title"><a v-bind:href="item.url">{{item.title || "they couldn't even be BOTHERED to write a title"}}</a></td>
        <td class="text-truncate listing-location">{{item.location}}</td>
        <td><div v-if="item.sublet" v-html="'&#x2705;'"></div></td>
        <td>{{item.price}}</td>
        <td>{{moment(item.posted_at).fromNow()}}</td>
      </tr>
    </table>
    <p class="text-center text-muted"><em>anything older than this probably isn't still around...</em></p>
    <p class="mb-4 text-center">Made by <a href="http://disambiguated.angusbayley.com">Angus Bayley</a>. <a href="mailto:hello@angusbayley.com">Feedback welcome</a>.</p>
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