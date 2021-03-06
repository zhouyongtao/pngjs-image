// Copyright 2015 Yahoo! Inc.
// Copyrights licensed under the Mit License. See the accompanying LICENSE file for terms.

// stRT - Structured Data

var Compressor = require('../processor/compressor');
var BufferedStream = require('../utils/bufferedStream');

/**
 * @class stRT
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
		return 600;
	},


	/**
	 * Gets the type of the structural data
	 *
	 * @method getDataType
	 * @return {string}
	 */
	getDataType: function () {
		return this._dataType || '----';
	},

	/**
	 * Sets the type of the structural data
	 *
	 * @method setDataType
	 * @param {string} type
	 */
	setDataType: function (type) {
		if (type.length !== 4) {
			throw new Error('The type has to have four characters.');
		}
		this._dataType = type;
	},


	/**
	 * Gets the major version
	 *
	 * @method getMajor
	 * @return {int}
	 */
	getMajor: function () {
		return this._dataMajor || 1;
	},

	/**
	 * Sets the major version
	 *
	 * @method setMajor
	 * @param {int} major
	 */
	setMajor: function (major) {
		if (major > 255) {
			throw new Error('Major version cannot be greater than 255');
		}
		this._dataMajor = major;
	},


	/**
	 * Gets the minor version
	 *
	 * @method getMinor
	 * @return {int}
	 */
	getMinor: function () {
		return this._dataMinor || 0;
	},

	/**
	 * Sets the minor version
	 *
	 * @method setMinor
	 * @param {int} minor
	 */
	setMinor: function (minor) {
		if (minor > 255) {
			throw new Error('Minor version cannot be greater than 255');
		}
		this._dataMinor = minor;
	},


	/**
	 * Gets the data content
	 *
	 * @method getContent
	 * @return {object}
	 */
	getContent: function () {
		return this._content || {};
	},

	/**
	 * Sets the data content
	 *
	 * @method setContent
	 * @param {object} data
	 */
	setContent: function (data) {
		this._content = data;
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

		var compressor,
			data;

		// Read the type
		this.setDataType(stream.readString(4, 'ascii'));

		// Read the version
		this.setMajor(stream.readUInt8());
		this.setMinor(stream.readUInt8());

		// Read the data
		data = stream.readBuffer(length - 6);

		// Decompress
		compressor = new Compressor();
		data = compressor.decompress(data);

		// Convert buffer into string
		this.setContent(JSON.parse(data.toString('utf8')));
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

		data.structures = [];
		chunks.forEach(function (chunk) {

			data.structures.push({
				type: chunk.getDataType(),
				major: chunk.getMajor(),
				minor: chunk.getMinor(),
				content: chunk.getContent()
			});
		});
	},


	/**
	 * Returns a list of chunks to be added to the data-stream
	 *
	 * Phase 1
	 *
	 * @static
	 * @method encodeData
	 * @param {object} data Object that will be used to import data to the chunk
	 * @return {Chunk[]} List of chunks to encode
	 */
	encodeData: function (data) {

		if (data.structures) {

			var chunk,
				result = [],
				type = this.getType(),
				chunks = this.getChunks();

			data.structures.forEach(function (structure) {

				chunk = this.createChunk(type, chunks);

				if (structure.type !== undefined) {
					chunk.setDataType(structure.type);
				}
				if (structure.major !== undefined) {
					chunk.setMajor(structure.major);
				}
				if (structure.minor !== undefined) {
					chunk.setMinor(structure.minor);
				}
				if (structure.content !== undefined) {
					chunk.setContent(structure.content);
				}

				result.push(chunk);

			}.bind(this));

			return result;
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

		var compressor,
			dataStr,
			data;

		dataStr = JSON.stringify(this.getContent() || {});

		// Compress the data
		compressor = new Compressor();
		data = compressor.compress(new Buffer(dataStr, 'utf8'));

		// Write the data-type
		stream.writeASCIIString(this.getDataType());

		// Write the version
		stream.writeUInt8(this.getMajor() & 0xff);
		stream.writeUInt8(this.getMinor() & 0xff);

		// Write the rest of the data
		stream.writeBuffer(data);
	}
};
