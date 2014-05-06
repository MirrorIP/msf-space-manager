var dataModelTemplates = {};

dataModelTemplates['mirror:application:activityrecommendationapp:recommendation'] = (function(){
	var templateUrl = 'templates/recommendation.template';
	function generateData(dataObject) {
		var data = {};
		data.title = dataObject.getElement().getElementsByTagName('title')[0].textContent;
		data.customId = dataObject.getElement().getAttribute('customId');
		data.issue = dataObject.getElement().getElementsByTagName('issue')[0].textContent;
		data.solution = dataObject.getElement().getElementsByTagName('solution')[0].textContent;
		var creationInfo = dataObject.getCDMData().getCreationInfo();
		var creationDate = new Date(creationInfo.getCreationDate());
		data.creationInfo = {
			date: creationDate.toString(),
			person: creationInfo.getCreator().split('@')[0]
		};
		return data;
	}
	
	var apply = function(dataObject, onSuccess, onError) {
		var data = generateData(dataObject);
		$.ajax({
        	url: templateUrl,
			cache: true,
			success: function(source) {
				template =  Handlebars.compile(source);
				onSuccess(template(data));
			},
			error: function(jqXHR, testStatus, errorThrown) {
				onError(errorThrown);
			}
		});
	};
	
	return {
		apply : apply
	};
})();

dataModelTemplates['mirror:application:activityrecommendationapp:experience'] = (function(){
	var templateUrl = 'templates/experience.template';
	function generateData(dataObject) {
		var data = {};
		data.ref = dataObject.getElement().getAttribute('ref');
		var ratingTags = dataObject.getElement().getElementsByTagName('rating');
		data.rating = ratingTags && ratingTags.length > 0 ? ratingTags[0].textContent : 'n/a';
		var commentTags = dataObject.getElement().getElementsByTagName('comment');
		data.comment = commentTags && commentTags.length > 0 ? commentTags[0].textContent : 'n/a';
		var creationInfo = dataObject.getCDMData().getCreationInfo();
		var creationDate = new Date(creationInfo.getCreationDate());
		data.creationInfo = {
			date: creationDate.toString(),
			person: creationInfo.getCreator().split('@')[0]
		};
		return data;
	}
	
	var apply = function(dataObject, onSuccess, onError) {
		var data = generateData(dataObject);
		$.ajax({
        	url: templateUrl,
			cache: true,
			success: function(source) {
				template =  Handlebars.compile(source);
				onSuccess(template(data));
			},
			error: function(jqXHR, testStatus, errorThrown) {
				onError(errorThrown);
			}
		});
	};
	
	return {
		apply : apply
	};
})();