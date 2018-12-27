import Vue from 'vue'
import axios from 'axios'
import moment from 'moment'

Vue.component("page-layout", {
  props: ['listings', 'moment'],
  template: `
    <div class="container">
        <h1>Hackney Wick spaces all-posts-in-one-page megalist 2000!!!!1</h1>
        <table class="posts">
            <tr>
                <th>what is this</th>
                <th>well WHERE IS IT??</th>
                <th>cheddar</th>
                <th>posted to the internet at</th>
            </tr>
            <tr
                v-for="item in listings"
                v-bind[item]="item"
                v-bind[key]="item.url">
                <td class="listing-title"><a v-bind:href="item.url">{{item.title || "they couldn't even be BOTHERED to write a title"}}</a></td>
                <td class="listing-location">{{item.location}}</td>
                <td>{{item.price}}</td>
                <td>{{moment(item.posted_at).fromNow()}}</td>
            </tr>
        </table>
    </div>`
})


const app = new Vue({
    el: "#app",
    data: {
        url: "https://europe-west1-hackney-wick-spaces-viewer.cloudfunctions.net/serveListings",
        completeListings: [],
        priceLimits: {upper: 800, lower: 100}
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
                return l.price < this.priceLimits.upper && l.price > this.priceLimits.lower
            })
        }
    },
    created() {
        this.getListings()
    }
})