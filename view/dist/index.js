"use strict";

Vue.component("page-layout", {
    props: ['listings'],
    template: "\n    <div class=\"container\">\n        <h1>Hackney Wick spaces all-posts-in-one-page megalist 2000!!!!1</h1>\n        <table class=\"posts\">\n            <tr>\n                <th>what is this</th>\n                <th>well WHERE IS IT??</th>\n                <th>cheddar</th>\n                <th>posted to the internet at</th>\n            </tr>\n            <tr\n                v-for=\"item in listings\"\n                v-bind[item]=\"item\"\n                v-bind[key]=\"item.url\">\n                <td class=\"listing-title\"><a v-bind:href=\"item.url\">{{item.title || \"they couldn't even be BOTHERED to write a title\"}}</a></td>\n                <td class=\"listing-location\">{{item.location}}</td>\n                <td>{{item.price}}</td>\n                <td>{{moment(item.posted_at).fromNow()}}</td>\n            </tr>\n        </table>\n    </div>"
});

var app = new Vue({
    el: "#app",
    data: {
        url: "https://europe-west1-hackney-wick-spaces-viewer.cloudfunctions.net/serveListings",
        completeListings: [],
        priceLimits: { upper: 800, lower: 100 }
    },
    methods: {
        getListings: function getListings() {
            var _this = this;

            axios({ method: "GET", url: this.url }).then(function (response) {
                console.log(response);
                _this.completeListings = response.data;
            }, function (error) {
                console.log(error);
            });
        }
    },
    computed: {
        listings: function listings() {
            var _this2 = this;

            return this.completeListings.filter(function (l) {
                return l.price < _this2.priceLimits.upper && l.price > _this2.priceLimits.lower;
            });
        }
    },
    beforeMount: function beforeMount() {
        console.log('beforeMount called');
        this.getListings();
    }
});