// Copyright 2015 Yahoo! Inc.
// Copyrights licensed under the Mit License. See the accompanying LICENSE file for terms.

/**
 * @class gAMA
 * @module PNG
 * @submodule PNGChunks
 */
module.exports = {

	/**
	 * Gets the sequence
	 *
	 * @method getSequence
	 * @return {int}
	 */
	getSequence: function () {
		return 190;
	},


	/**
	 * Gets the gamma value
	 *
	 * @method getGamma
	 * @return {float}
	 */
	getGamma: function () {
		return this._gamma || 1;
	},

	/**
	 * Sets the gamma value
	 *
	 * @method setGamma
	 * @param {float} value
	 */
	setGamma: function (value) {
		this._gamma = value;
	},


	/**
	 * Parsing of chunk data
	 *
	 * Phase 1
	 *
	 * @method parse
	 * @param {BufferedStream} stream Data stream
	 * @param {int} length Length of chunk data
	 * @param {boolean} strict Should parsing be strict?
	 */
	parse: function (stream, length, strict) {

		// Validation
		if (strict && (this.getFirstChunk(this.getType(), false) !== null)) {
			throw new Error('Only one ' + this.getType() + ' is allowed in the data.');
		}

		if ((strict && (length !== 4)) || (length < 4)) {
			throw new Error('The length of chunk ' + this.getType() + ' should be 4, but got ' + length + '.');
		}

		this.setGamma(stream.readUInt32BE() / 100000);
	},

	/**
	 * Gathers chunk-data from decoded chunks
	 *
	 * Phase 4
	 *
	 * @static
	 * @method decodeData
	 * @param {object} data Data-object that will be used to export values
	 * @param {boolean} strict Should parsing be strict?
	 */
	decodeData: function (data, strict) {

		var chunks = this.getChunksByType(this.getType());

		if (!chunks) {
			return ;
		}

		if (strict && (chunks.length !== 1)) {
			throw new Error('Not more than one chunk allowed for ' + this.getType() + '.');
		}

		data.gamma = chunks[0].getGamma();
	},


	/**
	 * Returns a list of chunks to be added to the data-stream
	 *
	 * Phase 1
	 *
	 * @static
	 * @method encodeData
	 * @param {Buffer} image Image data
	 * @param {object} data Object that will be used to import data to the chunk
	 * @return {Chunk[]} List of chunks to encode
	 */
	encodeData: function (image, data) {

		if (data.gamma) {

			var chunk = this.createChunk(this.getType(), this.getChunks());

			chunk.setGamma(data.gamma);

			return [chunk];
		} else {
			return [];
		}
	},

	/**
	 * Composing of chunk data
	 *
	 * Phase 4
	 *
	 * @method compose
	 * @param {BufferedStream} stream Data stream
	 */
	compose: function (stream) {
		stream.writeUInt32BE(this.getGamma() * 100000);
	}
};
